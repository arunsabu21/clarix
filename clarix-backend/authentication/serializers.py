from rest_framework import serializers
from .models import User


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "created_at"]
        read_only_fields = ["id", "created_at"]
