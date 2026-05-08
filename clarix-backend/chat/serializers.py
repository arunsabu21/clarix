from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
        ]


class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "message_count",
            "last_message",
            "created_at",
            "updated_at",
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


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
    conversation_id = serializers.UUIDField(required=False)
