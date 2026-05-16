from django.urls import path
from .views import (
    ProjectListView,
    ProjectDetailView,
    ArchiveProjectView,
    ProjectConversationsView,
    ReorderProjectsView,
    MoveConversationView,
)

urlpatterns = [
    path("", ProjectListView.as_view(), name="project-list"),
    path("reorder/", ReorderProjectsView.as_view(), name="project-reorder"),
    path(
        "move-conversation/",
        MoveConversationView.as_view(),
        name="project-move-conversation",
    ),
    path("<uuid:pk>/", ProjectDetailView.as_view(), name="project_detail"),
    path(
        "<uuid:pk>/archive/",
        ArchiveProjectView.as_view(),
        {"action": "archive"},
        name="project-archive",
    ),
    path(
        "<uuid:pk>/unarchive/",
        ArchiveProjectView.as_view(),
        {"action": "unarchive"},
        name="project-unarchive",
    ),
    path(
        "<uuid:pk>/conversations/",
        ProjectConversationsView.as_view(),
        name="project-conversations",
    ),
]
