from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.common.images import compress_image_to_webp
from apps.common.validators import validate_username

from .managers import UserManager


def avatar_upload_path(instance: "User", filename: str) -> str:
    return f"avatars/{instance.pk or 'new'}/{filename}"


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        validators=[validate_username],
    )
    display_name = models.CharField(max_length=80, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email

    def save(self, *args, **kwargs) -> None:
        if not self.display_name:
            self.display_name = self.username
        if self.avatar and hasattr(self.avatar, "file"):
            try:
                old = type(self).objects.filter(pk=self.pk).values_list("avatar", flat=True).first()
            except type(self).DoesNotExist:
                old = None
            if old != self.avatar.name:
                compress_image_to_webp(self.avatar, max_size=1024, quality=82)
        super().save(*args, **kwargs)

    @property
    def safe_display_name(self) -> str:
        return self.display_name or self.username
