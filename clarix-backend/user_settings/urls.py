from django.urls import path
from .views import (
    AllSettingsView,
    GeneralSettingsView,
    AccountSettingsView,
    DeleteAccountView,
    PrivacySettingsView,
    ClearConversationView,
    BillingSettingsView,
)

urlpatterns = [
    path("", AllSettingsView.as_view(), name="all-settings"),
    path("general/", GeneralSettingsView.as_view(), name="settings-general"),
    path("account/", AccountSettingsView.as_view(), name="settings-account"),
    path("account/delete/", DeleteAccountView.as_view(), name="settings-delete-account"),
    path("privacy/", PrivacySettingsView.as_view(), name="settings-privacy"),
    path(
        "privacy/clear-conversations/",
        ClearConversationView.as_view(),
        name="settings-clear-conversations",
    ),
    path("billing/", BillingSettingsView.as_view(), name="settings-billing"),
]