from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import UserSettings
from .serializers import (
    UserSettingsSerializer,
    AccountSerializer,
    DeleteAccountSerializer,
    PrivacySerializer,
)


User = get_user_model


def get_or_create_settings(user):
    settings, _ = UserSettings.objects.get_or_create(user=user)
    return settings


class GeneralSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_settings = get_or_create_settings(request.user)
        serializer = UserSettingsSerializer(user_settings)
        return Response(serializer.data)
    
    def patch(self, request):
        user_settings = get_or_create_settings(request.user)
        serializer = UserSettingsSerializer(
            user_settings,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        
        # Invalidate user cache after settings update
        try:
            from utils.user_cache import invalidate_user_cache
            invalidate_user_cache(str(request.user.id))
        except Exception:
            pass
        
        return Response(serializer.data)



class AccountSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            "full_name": user.name or "",
            "email": user.email,
            "date_joined": user.date_joined,
            "is_active": user.is_active,
        })
    
    def patch(self, request):
        serializer = AccountSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        user = request.user
        full_name = serializer.validated_data.get("full_name")
        
        if full_name is not None:
            user.name = full_name
            user.save(update_fields=["name"])
            
        # Invalidate user cache
        try:
            from utils.user_cache import invalidate_user_cache
            invalidate_user_cache(user.id)
        except Exception:
            pass
        
        return Response({
            "full_name": user.name or "",
            "email": user.email,
            "message": "Account updated successfully",
        })



class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        user = request.user
        
        try:
            # Cancel Stripe subscription if exists
            from upgrade.models import Subscription
            import stripe
            from django.conf import settings as django_settings
            
            stripe.api_key = django_settings.STRIPE_SECRET_KEY
            
            try:
                sub = Subscription.objects.get(user=user)
                if sub.stripe_subscription_id:
                    stripe.Subscription.cancel(sub.stripe_subscription_id)
            except Subscription.DoesNotExist:
                pass
        except Exception as e:
            print(f"Stripe cancel error on delete: {e}")
            
        # Delete user cascades to all related models
        user.delete()
        
        return Response(
            {"message": "Account deleted successfully"},
            status=status.HTTP_200_OK,
        )



class PrivacySettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_settings = get_or_create_settings(request.user)
        return Response({
            "allow_data_improvement": user_settings.allow_data_improvement,
            "allow_analytics": user_settings.allow_analytics,
        })
    
    def patch(self, request):
        serializer = PrivacySerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        user_settings = get_or_create_settings(request.user)
        
        if "allow_data_improvement" in serializer.validated_data:
            user_settings.allow_data_improvement = (
                serializer.validated_data["allow_data_improvement"]
            )
            
        if "allow_analytics" in serializer.validated_data:
            user_settings.allow_analytics = (
                serializer.validated_data["allow_analytics"]
            )
            
        user_settings.save()
        return Response({
            "allow_data_improvement": user_settings.allow_data_improvement,
            "allow_analytics": user_settings.allow_analytics,
            "message": "Privacy settings updated",
        })



class ClearConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            from chat.models import Conversation
            deleted_count, _ = Conversation.objects.filter(
                user=request.user
            ).delete()
            
            return Response({
                "message": f"Deleted {deleted_count} conversations(s).",
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



class BillingSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from upgrade.models import Subscription, Invoice, Plan
            
            sub, _ = Subscription.objects.get_or_create(
                user=request.user,
                defaults={"plan": Plan.FREE}
            )
            
            # Get last 5 invoices
            invoices = Invoice.objects.filter(
                user=request.user
            ).order_by("-created_at")[:5]
            
            invoice_data = [
                {
                    "id": str(inv.id),
                    "amount": inv.amount_paid / 100,
                    "currency": inv.currency.upper(),
                    "status": inv.status,
                    "date": inv.created_at,
                    "pdf": inv.invoice_pdf,
                }
                for inv in invoices
            ]
            
            return Response({
                "plan": sub.plan,
                "is_active": sub.is_active,
                "is_premium": sub.is_premium,
                "billing_cycle": sub.billing_cycle,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "invoices": invoice_data,
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )



class AllSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        user_settings = get_or_create_settings(user)
        settings_data = UserSettingsSerializer(user_settings).data
        
        # Billing
        billing_data = {}
        try:
            from upgrade.models import Subscription, Plan
            sub, _ = Subscription.objects.get_or_create(
                user=user,
                defaults={"plan", Plan.FREE},
            )
            billing_data = {
                "plan": sub.plan,
                "is_premium": sub.is_premium,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "current_period_end": sub.current_period_end,
            }
            
        except Exception:
            billing_data = {"plan": "free", "is_premium": False}
            
        return Response({
            "account": {
                "full_name": user.name or "",
                "email": user.email,
                "date_joined": user.date_joined,
            },
            "general": settings_data,
            "billing": billing_data,
        })