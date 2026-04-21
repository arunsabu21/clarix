from django.urls import path
from .views import (
    CheckoutView,
    PortalView,
    SubscriptionStatusView,
    WebhookView,
)

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="billing-checkout"),
    path("portal/", PortalView.as_view(), name="billing-portal"),
    path("status/", SubscriptionStatusView.as_view(), name="billing-status"),
    path("webhook/", WebhookView.as_view(), name="billing-webhook"),
]