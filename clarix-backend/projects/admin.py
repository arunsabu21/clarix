from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "icon",
        "name",
        "user",
        "conversation_count",
        "is_archived",
        "sort_order",
        "updated_at",
    ]
    list_filter = [
        "is_archived",
        "created_at",
    ]
    search_fields = [
        "name",
        "user__email",
        "description",
    ]
    read_only_fields = [
        "id",
        "created_at",
        "updated_at",
    ]
    ordering = ["user", "sort_order"]

    fieldsets = (
        ("Project", {
            "fields": ("id", "user", "name", "description", "icon", "color"),
        }),
        ("Settings", {
            "fields": ("is_archived", "sort_order"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
