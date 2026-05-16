import uuid
from django.db import models
from django.conf import settings


class Project(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    icon = models.CharField(
        max_length=50,
        blank=True,
        default="folder",
        help_text="Project icon",
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        default="#5c6bc0",
        help_text="Hex color for project card",
    )
    is_archived = models.BooleanField(default=False)
    sort_order = models.IntegerField(
        default=0, help_text="Manual sort order - lower = first"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.icon} {self.name} ({self.user.email})"

    @property
    def conversation_count(self):
        return self.conversations.count()

    class Meta:
        db_table = "projects"
        ordering = ["sort_order", "-updated_at"]
        verbose_name = "Project"
        verbose_name_plural = "Projects"
