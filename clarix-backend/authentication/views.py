from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from utils.token_cache import blacklist_token
from utils.user_cache import get_cached_user, invalidate_user_cache
from utils.rate_limiter import is_rate_limited, get_rate_limit_key, get_client_ip, RATE_LIMITS
from django.core.cache import cache
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

        # Rate Limit - Redis based, max 5 OTP requests per hour email
        config = RATE_LIMITS["otp"]
        key = get_rate_limit_key("otp", email)
        wait = is_rate_limited(key, config["limit"], config["window"])
        
        if wait:
            message = config["message"].format(wait_time=wait)
            return Response(
                {"error": message},
                status=status.HTTP_429_TOO_MANY_REQUESTS
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
        
        ip = get_client_ip(request)
        config = RATE_LIMITS["verify_otp"]
        key = get_rate_limit_key("verify_otp", ip)
        wait = is_rate_limited(key, config["limit"], config["window"])
        
        if wait:
            message = config["message"].format(wait_time=wait)
            return Response(
                {"error": message}, status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        # Get latest unused OTP
        otp_obj = (
            OTPCode.objects.filter(email=email, is_used=False)
            .order_by("-created_at")
            .first()
        )
        
        if not otp_obj:
            return Response(
                {"error": "Invalid OTP code."},
                status=status.HTTP_400_BAD_REQUEST
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
        
        # Cache the user immediately after login
        cache.set(f"user:{user.id}", user, timeout=60 * 15)

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
            
            blacklist_token(str(token["jti"]))
            token.blacklist()
            invalidate_user_cache(str(request.user.id)) # clear cache on logout
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
        user = get_cached_user(str(request.user.id)) # Redis first, DB fallback
        return Response(UserSerializer(user).data)
