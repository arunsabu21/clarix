import uuid
from django.db import models
from django.conf import settings


class Plan(models.TextChoices):
    FREE = "free", "Free"
    PRO = "pro", "Pro"
    MAX = "max", "Max"


class BillingCycle(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class Subscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.CharField(
        max_length=10,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    billing_cycle = models.CharField(
        max_length=10,
        choices=BillingCycle.choices,
        null=True,
        blank=True,
    )

    # Stripe IDs
    stripe_customer_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_price_id = models.CharField(max_length=100, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    cancel_at_period_end = models.BooleanField(default=False)

    # Dates
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.plan}"

    @property
    def is_pro(self):
        return self.plan == Plan.PRO and self.is_active

    @property
    def is_max(self):
        return self.plan == Plan.MAX and self.is_active

    @property
    def is_premium(self):
        return self.plan in [Plan.PRO, Plan.MAX] and self.is_active

    class Meta:
        db_table = "billing_subscription"


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    stripe_invoice_id = models.CharField(max_length=100, unique=True)
    amount_paid = models.IntegerField()
    currency = models.CharField(max_length=10, default="usd")
    status = models.CharField(max_length=20)
    invoice_pdf = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - ${self.amount_paid / 100}"

    class Meta:
        db_table = "billing_invoices"
        ordering = ["-created_at"]
