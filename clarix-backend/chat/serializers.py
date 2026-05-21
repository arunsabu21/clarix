from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    project = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
            "project",
        ]

    def get_project(self, obj):
        if not obj.project:
            return None
        
        return {
            "id": str(obj.project.id),
            "name": obj.project.name,
            "icon": obj.project.icon,
            "color": obj.project.color,
            "description": obj.project.description or "",
        }


class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    project_icon = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "message_count",
            "last_message",
            "created_at",
            "updated_at",
            "project_name",
            "project_icon",
        ]
    
    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        
        if not last:
            return None
        
        return {
            "role": last.role,
            "content": last.content[:100],
            "created_at": last.created_at,
        }
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_project_name(self, obj):
        return obj.project.name if obj.project else None
    
    def get_project_icon(self, obj):
        return obj.project.icon if obj.project else None


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
    conversation_id = serializers.UUIDField(required=False)
