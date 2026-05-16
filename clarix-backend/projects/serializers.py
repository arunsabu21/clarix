from rest_framework import serializers
from .models import Project
import re


class ProjectSerializer(serializers.ModelSerializer):
    conversation_count = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "color",
            "is_archived",
            "sort_order",
            "conversation_count",
            "last_activity",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "conversation_count",
            "last_activity",
            "created_at",
            "updated_at",
        ]
    
    def get_conversation_count(self, obj):
            return obj.conversations.count()
    
    def get_last_activity(self, obj):
        last = obj.conversations.order_by("-updated_at").first()
        return last.updated_at if last else obj.updated_at

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project name cannot be empty")
        if len(value) > 100:
            raise serializers.ValidationError("Name must be 100 character or less")
        return value
    
    def validate_color(self, value):
        if value and not re.match(r"^#[0-9A-Fa-f]{6}$", value):
            raise serializers.ValidationError(
                "Color must be a valid hex code e.g #5c6bc0"
                )
        return value

    def validate_icon(self, value):
        if len(value) > 10:
            raise serializers.ValidationError("Icon too long")
        return value


class ProjectListSerializer(serializers.ModelSerializer):
    conversation_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "icon",
            "color",
            "is_archived",
            "sort_order",
            "conversation_count",
            "updated_at",
        ]

    def get_conversation_count(self, obj):
        return obj.conversations.count()


class AddConversationSerializer(serializers.Serializer):
    """Add/remove conversation from project"""

    conversation_id = serializers.UUIDField()


class ReorderSerializer(serializers.Serializer):
    projects = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate_projects(self, value):
        for item in value:
            if "id" not in item or "sort_order" not in item:
                raise serializers.ValidationError(
                    "Each item must have id and sort_order"
                )
        return value
