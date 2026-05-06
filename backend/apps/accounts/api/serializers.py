from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.common.validators import validate_username

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    displayName = serializers.CharField(source="display_name", read_only=True)
    isStaff = serializers.BooleanField(source="is_staff", read_only=True)
    dateJoined = serializers.DateTimeField(source="date_joined", read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "displayName",
            "avatar",
            "isStaff",
            "dateJoined",
        )

    def get_avatar(self, obj) -> str | None:
        request = self.context.get("request")
        if not obj.avatar:
            return None
        url = obj.avatar.url
        if request is None:
            return url
        return request.build_absolute_uri(url)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    username = serializers.CharField(max_length=30, validators=[validate_username])
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    displayName = serializers.CharField(
        source="display_name",
        required=False,
        allow_blank=True,
        max_length=80,
    )

    def validate_email(self, value: str) -> str:
        normalized = value.lower().strip()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Email already in use", code="email_taken")
        return normalized

    def validate_username(self, value: str) -> str:
        normalized = value.strip()
        if User.objects.filter(username__iexact=normalized).exists():
            raise serializers.ValidationError("Username already taken", code="username_taken")
        return normalized

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages), code="password_weak") from exc
        return value

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            display_name=validated_data.get("display_name", "") or validated_data["username"],
        )


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(write_only=True)


class UpdateProfileSerializer(serializers.ModelSerializer):
    displayName = serializers.CharField(source="display_name", required=False, allow_blank=False, max_length=80)

    class Meta:
        model = User
        fields = ("displayName",)


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_newPassword(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages), code="password_weak") from exc
        return value


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()
