from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    DeleteAllConversationsView,
    DeleteMultipleConversationsView,
    SendMessageView,
)

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/delete-all/",
        DeleteAllConversationsView.as_view(),
        name="conversation-delete-all",
    ),
    path(
        "conversations/delete-multiple/",
        DeleteMultipleConversationsView.as_view(),
        name="conversation-delete-multiple",
    ),
    path(
        "conversations/<uuid:pk>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path("send/", SendMessageView.as_view(), name="send-message"),
]
