from django.conf import settings
from django.db import models
from django.utils import timezone


class UserFollow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following_relations",
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="follower_relations",
    )
    followed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "social_user_follow"
        ordering = ["-followed_at"]
        unique_together = (("follower", "followed"),)
        indexes = [
            models.Index(fields=["follower", "-followed_at"]),
            models.Index(fields=["followed", "-followed_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=~models.Q(follower=models.F("followed")),
                name="social_user_follow_not_self",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.follower_id} -> {self.followed_id}"
