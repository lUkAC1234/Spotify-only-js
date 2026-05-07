from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import UserFollow


@admin.register(UserFollow)
class UserFollowAdmin(ModelAdmin):
    list_display = ("follower", "followed", "followed_at")
    autocomplete_fields = ("follower", "followed")
    readonly_fields = ("followed_at",)
    search_fields = ("follower__username", "followed__username")
