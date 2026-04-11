from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from utils.ai_cache import get_cached_ai_response, cache_ai_response

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationListSerializer,
    SendMessageSerializer,
    MessageSerializer,
)
from .services.llm import get_ai_response


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(user=request.user)
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


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id")

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
        
        model = request.data.get('model', 'gemini')

        # Get AI Response
        try:
            # Check cache
            cached = get_cached_ai_response(history, model)
            if cached:
                ai_response = cached
            else:
                ai_response = get_ai_response(history, model=model)
                cache_ai_response(history, model, ai_response) # Store in Redis
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
