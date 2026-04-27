import uuid
from django.db import models
from django.conf import settings


class WorkType(models.TextChoices):
    STUDENT = "student", "Student"
    DEVELOPER = "developer", "Developer"
    DESIGNER = "designer", "Designer"
    RESEARCHER = "researcher", "Researcher"
    WRITER = "writer", "Writer"
    MARKETER = "marketer", "Marketer"
    MANAGER = "manager", "Manager"
    ENTREPRENEUR = "entrepreneur", "Entrepreneur"
    OTHER = "other", "Other"


class ProfessionalPreference(models.TextChoices):
    BEGINNER = "beginner", "Beginner - explain concepts simply"
    INTERMEDIATE = "intermediate", "Intermediate - assume basic knowledge"
    EXPERT = "expert", "Expert - use technical language"


class AppearanceMode(models.TextChoices):
    LIGHT = "light", "Light"
    DARK = "dark", "Dark"
    AUTO = "auto", "Auto (System)"


class UserSettings(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_settings",
    )
    ai_name = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="What Clarix AI should call you?"
    )
    work_type = models.CharField(
        max_length=20,
        choices=WorkType.choices,
        default=WorkType.OTHER,
    )
    professional_preference = models.CharField(
        max_length=20,
        choices=ProfessionalPreference.choices,
        default=ProfessionalPreference.INTERMEDIATE,
    )
    
    # NOTIFICATIONS
    notify_response_complete = models.BooleanField(
        default=True,
        help_text="Notify when AI response is complete",
    )
    notify_product_updates = models.BooleanField(
        default=True,
        help_text="Receive product update emails",
    )
    notify_billing_alerts = models.BooleanField(
        default=True,
        help_text="Receive billing and payment alerts",
    )
    
    # APPEARANCE
    appearance = models.CharField(
        max_length=10,
        choices=AppearanceMode.choices,
        default=AppearanceMode.AUTO,
    )
    
    # PRIVACY
    allow_data_improvement = models.BooleanField(
        default=True,
        help_text="Allow conversations to improve Clarix AI",
    )
    allow_analytics = models.BooleanField(
        default=True,
        help_text="Allow anonymous usage analytics"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Settings - {self.user.email}"
    
    class Meta:
        db_table = "user_settings"
        verbose_name = "User Settings"
        verbose_name_plural = "User Settings"