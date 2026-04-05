from django.urls import path
from .views import ConversationListView, ConversationDetailView, SendMessageView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversations"),
    path(
        "conversations/<uuid:pk>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path("send/", SendMessageView.as_view(), name="send-message"),
]
