from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import PlaybackState, PlayEvent


@admin.register(PlaybackState)
class PlaybackStateAdmin(ModelAdmin):
    list_display = ("user", "track", "position_ms", "is_playing", "repeat_mode", "shuffle_enabled", "updated_at")
    list_filter = ("is_playing", "repeat_mode", "shuffle_enabled")
    autocomplete_fields = ("user", "track")
    readonly_fields = ("updated_at",)


@admin.register(PlayEvent)
class PlayEventAdmin(ModelAdmin):
    list_display = ("user", "track", "ms_listened", "source", "played_at")
    list_filter = ("source",)
    autocomplete_fields = ("user", "track")
    readonly_fields = ("played_at",)
    date_hierarchy = "played_at"
