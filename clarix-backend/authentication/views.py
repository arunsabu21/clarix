from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import User, OTPCode
from .serializers import RequestOTPSerializer, VerifyOTPSerializer, UserSerializer
from .utils import generate_otp
from .emails import send_otp_email


class RequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        name = serializer.validated_data.get("name", "")

        # Rate Limit - max 3 active OTP per email
        active_otps = OTPCode.objects.filter(
            email=email, is_used=False, expires_at__gt=timezone.now()
        ).count()

        if active_otps >= 3:
            return Response(
                {"error": "Too many OTP requests. Please wait before trying again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Invalidate old OTPs
        OTPCode.objects.filter(email=email, is_used=False).update(is_used=True)

        # Generate and save new OTP
        otp = generate_otp()
        OTPCode.objects.create(email=email, code=otp)

        # Send Email
        send_otp_email(email, otp, name)

        return Response(
            {"message": "OTP sent to your email"}, status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        # Get latest unused OTP
        try:
            otp_obj = (
                OTPCode.objects.filter(email=email, is_used=False)
                .order_by("-created_at")
                .first()
            )

        except OTPCode.DoesNotExist:
            return Response(
                {"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check attempts
        if otp_obj.attempts >= 5:
            return Response(
                {"error": "Too many attempts. Request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check expiry
        if otp_obj.is_expired():
            return Response(
                {"error": "OTP expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check code
        if otp_obj.code != otp:
            otp_obj.attempts += 1
            otp_obj.save()
            remaining = 5 - otp_obj.attempts
            return Response(
                {"error": f"Invalid OTP. {remaining} attempts remaining."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark OTP as Used
        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])

        # Get or create user
        user, created = User.objects.get_or_create(email=email)

        # Issue JWT
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": created,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Logged out successfully."}, status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {"error": "Invalid Token"}, status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
