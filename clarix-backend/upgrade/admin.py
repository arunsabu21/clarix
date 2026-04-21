from django.contrib import admin
from .models import Subscription, Invoice


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "is_active", "billing_cycle", "current_period_end"]
    list_filter = ["plan", "is_active"]
    search_fields = ["user__email", "stripe_customer_id"]
    readonly_fields = ["stripe_customer_id", "stripe_subscription_id", "created_at"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["user", "amount_paid", "currency", "status", "created_at"]
    readonly_fields = ["stripe_invoice_id", "created_at"]
