from rest_framework import serializers
from .models import UserSettings, WorkType, ProfessionalPreference, AppearanceMode


class UserSettingsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = UserSettings
        fields = [
            "ai_name",
            "work_type",
            "professional_preference",
            "notify_response_complete",
            "notify_product_updates",
            "notify_billing_alerts",
            "appearance",
            "allow_data_improvement",
            "allow_analytics",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
        
    def validate_ai_name(self, value):
        value = value.strip()
        if len(value) > 50:
            raise serializers.ValidationError(
                "Name must be 50 characters or less."
            )
        return value
    
    def validate_work_type(self, value):
        valid = [choice[0] for choice in WorkType.choices]
        if value not in valid:
            raise serializers.ValidationError("Invalid working type")
        return value
    
    def validate_professional_preference(self, value):
        valid = [choice[0] for choice in ProfessionalPreference.choices]
        if value not in valid:
            raise serializers.ValidationError("Invalid preference.")
        return value
    
    def validate_appearance(self, value):
        valid = [choice[0] for choice in AppearanceMode.choices]
        if value not in valid:
            raise serializers.ValidationError("Invalid appearance mode.")
        return value


class AccountSerializer(serializers.Serializer):
    full_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank = True,
    )
    email = serializers.EmailField(read_only=True)
    
    def validate_full_name(self, value):
        return value.strip()


class DeleteAccountSerializer(serializers.Serializer):
    confirmation = serializers.CharField()
    
    def validate_confirmation(self, value):
        if value.lower() != "delete my account":
            raise serializers.ValidationError(
                'Type "delete my account" to confirm.'
            )
        return value


class PrivacySerializer(serializers.Serializer):
    allow_data_improvement = serializers.BooleanField()
    allow_analytics = serializers.BooleanField()