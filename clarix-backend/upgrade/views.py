import stripe
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Subscription, Invoice, Plan


stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan = request.query_params.get("plan", "pro")
        billing = request.query_params.get("billing", "monthly")

        price_key = f"{plan}_{billing}"
        price_id = settings.STRIPE_PRICES.get(price_key)

        if not price_id:
            return Response(
                {"error": "Invalid plan or billing cycle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            sub, _ = Subscription.objects.get_or_create(
                user=request.user,
                defaults={"plan": Plan.FREE},
            )

            if sub.stripe_customer_id:
                customer_id = sub.stripe_customer_id
            else:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    metadata={"user_id": str(request.user.id)},
                )
                customer_id = customer.id
                sub.stripe_customer_id = customer_id
                sub.save(update_fields=["stripe_customer_id"])

            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                mode="subscription",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/pricing",
                metadata={
                    "user_id": str(request.user.id),
                    "plan": plan,
                    "billing": billing,
                },
                subscription_data={
                    "trial_period_days": 7,  # 7 day free trail
                    "metadata": {
                        "user_id": str(request.user.id),
                        "plan": plan,
                    },
                },
            )

            return Response({"checkout_url": session.url})

        except stripe.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = Subscription.objects.get(user=request.user)

            if not sub.stripe_customer_id:
                return Response(
                    {"error": "No active subscription found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            session = stripe.billing_portal.Session.create(
                customer=sub.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/settings",
            )
            return Response({"portal_url": session.url})

        except Subscription.DoesNotExist:
            return Response(
                {"error": "Subscription not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except stripe.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub, _ = Subscription.objects.get_or_create(
            user=request.user,
            defaults={"plan": Plan.FREE},
        )

        return Response(
            {
                "plan": sub.plan,
                "is_active": sub.is_active,
                "is_premium": sub.is_premium,
                "billing_cycle": sub.billing_cycle,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "current_period_end": sub.current_period_end,
                "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.SignatureVerificationError:
            return Response(
                {"error": "Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            # Payment successful - active subscription
            _handle_checkout_completed(data)

        elif event_type == "customer.subscription.updated":
            # Plan changed / Renewed
            _handle_subscription_updated(data)

        elif event_type == "customer.subscription.deleted":
            # Cancelled downgrade to free
            _handle_subscription_deleted(data)

        elif event_type == "invoice.payment_succeeded":
            # Payment received - save invoice
            _handle_invoice_paid(data)

        elif event_type == "invoice.payment_failed":
            # Payment Failed
            _handle_payment_failed(data)

        return Response({"status": "ok"})


# Webhook Handlers
def _handle_checkout_completed(session):
    user_id = session.get("metadata", {}).get("user_id")
    plan = session.get("metadata", {}).get("plan", "pro")

    if not user_id:
        return

    try:
        from authentication.models import User

        user = User.objects.get(id=user_id)
        sub, _ = Subscription.objects.get_or_create(user=user)

        sub.plan = plan
        sub.is_active = True
        sub.stripe_subscription_id = session.get("subscription")
        sub.save(update_fields=["plan", "is_active", "stripe_subscription_id"])

    except Exception as e:
        print(f"Webhook error (checkout): {e}")


def _handle_subscription_updated(subscription):
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription["id"])

        sub.is_active = subscription["status"] == "active"
        sub.cancel_at_period_end = subscription.get("cancel_at_period_end", False)

        period_end = subscription.get("current_period_end")

        if not period_end:
            sub.current_period_end = timezone.datetime.fromtimestamp(
                period_end, tz=timezone.utc
            )
        sub.save()

    except Subscription.DoesNotExist:
        print(f"Subscription not found: {subscription['id']}")


def _handle_subscription_deleted(subscription):
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription["id"])
        sub.plan = Plan.FREE
        sub.is_active = True
        sub.stripe_subscription_id = None
        sub.cancel_at_period_end = False
        sub.save()

    except Subscription.DoesNotExist:
        pass


def _handle_invoice_paid(invoice):
    try:
        customer_id = invoice.get("customer")
        sub = Subscription.objects.get(stripe_customer_id=customer_id)

        Invoice.objects.get_or_create(
            stripe_invoice_id=invoice["id"],
            defaults={
                "user": sub.user,
                "amount_paid": invoice.get("amount_paid", 0),
                "currency": invoice.get("currency", "usd"),
                "status": invoice.get("status", "paid"),
                "invoice_pdf": invoice.get("invoice_pdf"),
            },
        )
    except Subscription.DoesNotExist:
        pass


def _handle_payment_failed(invoice):
    customer_id = invoice.get("customer")
    print(f"Payment failed for customer: {customer_id}")