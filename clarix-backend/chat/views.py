from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from utils.ai_cache import get_cached_ai_response, cache_ai_response
from utils.rate_limiter import (
    is_rate_limited,
    get_rate_limit_key,
    get_rate_limits_for_user,
    RATE_LIMITS,
)

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationListSerializer,
    SendMessageSerializer,
    MessageSerializer,
)
from .services.llm import get_ai_response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(user=request.user)
        
        search = request.query_params.get("search", "").strip()
        if search:
            conversations = conversations.filter(
                Q(title__icontains=search)
            )
        
        ordering = request.query_params.get("ordering", "-updated_at")
        allowed = ["updated_at", "-updated_at", "created_at", "-created_at", "title", "-title"]
        if ordering not in allowed:
            ordering = "-updated_at"
        conversations = conversations.order_by(ordering)
        
        paginator = ConversationPagination()
        page = paginator.paginate_queryset(conversations, request)
        if page is not None:
            serializer = ConversationListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = ConversationListSerializer(conversations, many=True)
        return Response(serializer.data)

    def post(self, request):
        conversation = Conversation.objects.create(user=request.user)
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": "Not Found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ConversationSerializer(conversation)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
            conversation.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Conversation.DoesNotExist:
            return Response({"error": "Not Found."}, status=status.HTTP_404_NOT_FOUND)
    
    def patch(self, request, pk):
        try:
            conversation = Conversation.objects.get(
                pk=pk,
                user=request.user
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Not Found"}, status=status.HTTP_404_NOT_FOUND)
        
        title = request.data.get("title", "").strip()
        
        if not title:
            return Response({"error": "Title cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(title) > 100:
            return Response({"error": "Title too long"}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation.title = title
        conversation.save(update_fields=["title", "updated_at"])
        
        return Response({"id": str(conversation.id), "title": conversation.title})


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id")

        config = get_rate_limits_for_user(request.user)
        key = get_rate_limit_key("ai_message", str(request.user.id))
        wait = is_rate_limited(key, config["limit"], config["window"])

        if wait:
            message = config["message"].format(wait_time=wait)
            return Response(
                {"error": message}, status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    pk=conversation_id, user=request.user
                )
            except Conversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            conversation = Conversation.objects.create(user=request.user)

        # Save user message
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=user_message,
        )

        # Build message history for LLM
        history = list(conversation.messages.values("role", "content"))

        model = request.data.get("model", "gemini")

        # Get AI Response
        try:
            # Check cache
            cached = get_cached_ai_response(history, model)
            if cached:
                ai_response = cached
            else:
                ai_response = get_ai_response(history, model=model)
                cache_ai_response(history, model, ai_response)  # Store in Redis
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Save AI Message
        ai_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response,
        )

        # Auto generate title from first message
        if not conversation.title:
            conversation.title = user_message[:60]
            conversation.save()

        return Response(
            {
                "conversation_id": str(conversation.id),
                "message": MessageSerializer(ai_message).data,
            },
            status=status.HTTP_200_OK,
        )


class ConversationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


class DeleteAllConversationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        deleted_count, _ = Conversation.objects.filter(
            user=request.user
        ).delete()
        return Response({
            "message": f"Deleted {deleted_count} conversation(s).",
            "deleted_count": deleted_count,
        })


class DeleteMultipleConversationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        ids = request.data.get("ids", [])
        
        if not ids:
            return Response(
                {"error": "No conversation IDs provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        deleted_count, _ = Conversation.objects.filter(
            user=request.user,
            id__in=ids,
        ).delete()
        
        return Response({
            "message": f"Deleted {deleted_count} conversation(s).",
            "deleted_count": deleted_count,
        })
