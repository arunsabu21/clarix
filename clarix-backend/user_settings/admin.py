from django.contrib import admin
from .models import UserSettings


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "ai_name",
        "work_type",
        "professional_preference",
        "appearance",
        "allow_data_improvement",
        "updated_at",
    ]
    
    list_filter = [
        "work_type",
        "professional_preference",
        "appearance",
        "allow_data_improvement",
    ]
    
    search_fields = ["user__email", "ai_name"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ("User", {"fields": ("user",)}),
        ("General", {
            "fields": (
                "ai_name",
                "work_type",
                "professional_preference",
            )
        }),
        ("Notifications", {
            "fields": (
                "notify_response_complete",
                "notify_product_updates",
                "notify_billing_alerts",
            )
        }),
        ("Appearance", {"fields": ("appearance",)}),
        ("Privacy", {
            "fields": (
                "allow_data_improvement",
                "allow_analytics",
            )
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
