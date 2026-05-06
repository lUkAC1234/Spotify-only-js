from django.conf import settings
from django.db import models


class RepeatMode(models.TextChoices):
    OFF = "off", "Off"
    ALL = "all", "All"
    ONE = "one", "One"


class PlaybackState(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playback_state",
        primary_key=True,
    )
    track = models.ForeignKey(
        "catalog.Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    position_ms = models.PositiveIntegerField(default=0)
    is_playing = models.BooleanField(default=False)
    volume = models.FloatField(default=0.8)
    is_muted = models.BooleanField(default=False)
    repeat_mode = models.CharField(max_length=8, choices=RepeatMode.choices, default=RepeatMode.OFF)
    shuffle_enabled = models.BooleanField(default=False)
    queue_track_ids = models.JSONField(default=list, blank=True)
    history_track_ids = models.JSONField(default=list, blank=True)
    context_type = models.CharField(max_length=24, blank=True)
    context_id = models.CharField(max_length=128, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "playback_state"
        verbose_name = "Playback state"
        verbose_name_plural = "Playback states"

    def __str__(self) -> str:
        return f"PlaybackState({self.user_id})"


class PlayEvent(models.Model):
    class Source(models.TextChoices):
        SEARCH = "search", "Search"
        PLAYLIST = "playlist", "Playlist"
        ALBUM = "album", "Album"
        ARTIST = "artist", "Artist"
        HOME = "home", "Home"
        QUEUE = "queue", "Queue"
        TRACK = "track", "Track"
        RADIO = "radio", "Radio"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="play_events",
    )
    track = models.ForeignKey(
        "catalog.Track",
        on_delete=models.CASCADE,
        related_name="play_events",
    )
    ms_listened = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=24, choices=Source.choices, default=Source.TRACK)
    played_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "playback_event"
        verbose_name = "Play event"
        verbose_name_plural = "Play events"
        indexes = [
            models.Index(fields=["user", "-played_at"]),
        ]
        ordering = ["-played_at"]

    def __str__(self) -> str:
        return f"PlayEvent(user={self.user_id} track={self.track_id})"
