from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Project

from .serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    AddConversationSerializer,
    ReorderSerializer,
)
from chat.serializers import ConversationListSerializer
from chat.models import Conversation


class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = Project.objects.filter(user=request.user)
        archived = request.query_params.get("archived", "false").lower()

        if archived == "true":
            projects = projects.filter(is_archived=True)
        else:
            projects = projects.filter(is_archived=False)

        search = request.query_params.get("search", "").strip()

        if search:
            projects = projects.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        ordering = request.query_params.get("ordering", "sort_order")
        allowed = [
            "sort_order",
            "-sort_order",
            "name",
            "-name",
            "updated_at",
            "-updated_at",
            "created_at",
            "-created_at",
        ]

        if ordering not in allowed:
            ordering = "sort_order"

        projects = projects.order_by(ordering)

        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Check project limit (max 20 per user)
        existing = Project.objects.filter(
            user=request.user,
            is_archived=False,
        ).count()

        if existing >= 10:
            return Response(
                {"error": "Maximum 20 active projects allowed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProjectSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        max_order = Project.objects.filter(
            user=request.user,
        ).count()

        project = serializer.save(user=request.user, sort_order=max_order)
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Project.objects.get(pk=pk, user=user)
        except Project.DoesNotExist:
            return None

    def get(self, request, pk):
        project = self.get_object(pk, request.user)

        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        conversations = project.conversations.order_by("updated_at")
        conv_data = ConversationListSerializer(conversations, many=True).data

        data = ProjectSerializer(project).data
        data["conversations"] = conv_data
        return Response(data)

    def patch(self, request, pk):
        project = self.get_object(pk, request.user)

        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProjectSerializer(project, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        project = self.get_object(pk, request.user)

        if not project:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )
        project.delete()
        return Response(
            {"message": "Project deleted. Conversations are preserved"},
            status=status.HTTP_200_OK,
        )


class ArchiveProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        try:
            project = Project.objects.get(pk=pk, user=request.user)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if action == "archive":
            project.is_archived = True
            msg = f"Project '{project.name}' archived."
        elif action == "unarchive":
            project.is_archived = False
            msg = f"Project '{project.name}' unarchived."
        else:
            return Response(
                {"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST
            )

        project.save(update_fields=["is_archived", "updated_at"])
        return Response(
            {
                "message": msg,
                "id": str(project.id),
                "is_archived": project.is_archived,
            }
        )


class ProjectConversationsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = AddConversationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        conv_id = serializer.validated_data["conversation_id"]

        try:
            conversation = Conversation.objects.get(
                id=conv_id,
                user=request.user,
            )
        except Exception:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        conversation.project = project
        conversation.save(update_fields=["project"])

        return Response({
            "message": f"Conversation added to {project.name}",
            "conversation_id": str(conv_id),
            "project_id": str(project.id),
        })
    
    def delete(self, request, pk):
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        serializer = AddConversationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        conv_id = serializer.validated_data["conversation_id"]

        try:
            conversation = Conversation.objects.get(
                id=conv_id,
                user=request.user,
                project=project,
            )
        except Exception:
            return Response(
                {"error": "Conversation not in this project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        conversation.project = None
        conversation.save(update_fields=["project"])

        return Response({
            "message": "Conversation removed from project",
            "conversation_id": str(conv_id),
        })
    
    def _get_project(self, pk, user):
        try:
            return Project.objects.get(pk=pk, user=user)
        except Project.DoesNotExist:
            return None


class ReorderProjectsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReorderSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        projects_data = serializer.validated_data["projects"]
        updated = []

        for item in projects_data:
            try:
                project = Project.objects.get(
                    id=item["id"],
                    user=request.user,
                )
                project.sort_order = int(item["sort_order"])
                project.save(update_fields=["sort_order"])
                updated.append(str(project.id))

            except Project.DoesNotExist:
                continue

        return Response({
            "message": f"Reordered {len(updated)} project(s).",
            "updated": updated,
        })


class MoveConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        conv_id = request.data.get("conversation_id")
        project_id = request.data.get("project_id")

        if not conv_id:
            return Response(
                {"error": "conversation_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            conversation = Conversation.objects.get(
                id=conv_id,
                user=request.user,
            )
        except Exception:
            return Response(
                {"error": "Conversation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if project_id:
            try:
                project = Project.objects.get(
                    id=project_id,
                    user=request.user,
                )
                conversation.project = project
                msg = f"Moved tp '{project.name}'"

            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            conversation.project = None
            msg = "Removed from project"
        
        conversation.save(update_fields=["project"])
        return Response({"message": msg})
