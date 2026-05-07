from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def _slugify_unique(model: type[models.Model], base: str, ignore_pk: int | None = None) -> str:
    base_slug = slugify(base) or "playlist"
    candidate = base_slug
    suffix = 2
    qs = model.objects.all()
    if ignore_pk:
        qs = qs.exclude(pk=ignore_pk)
    while qs.filter(slug=candidate).exists():
        candidate = f"{base_slug}-{suffix}"
        suffix += 1
    return candidate


class Playlist(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.CharField(max_length=320, blank=True)
    cover = models.URLField(max_length=600, blank=True)
    cover_mosaic = models.CharField(max_length=300, blank=True)
    cover_image = models.ImageField(upload_to="playlist-covers/uploads/", blank=True, null=True)
    is_public = models.BooleanField(default=True)
    is_collaborative = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "library_playlist"
        ordering = ["sort_order", "-updated_at"]
        indexes = [
            models.Index(fields=["is_system", "sort_order"]),
            models.Index(fields=["owner", "-updated_at"]),
        ]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _slugify_unique(Playlist, self.title, ignore_pk=self.pk)
        super().save(*args, **kwargs)

    @property
    def effective_cover(self) -> str:
        if self.cover_image:
            return self.cover_image.url
        if self.cover_mosaic:
            return self.cover_mosaic
        return self.cover

    def __str__(self) -> str:
        return self.title


class PlaylistItem(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="items")
    track = models.ForeignKey("catalog.Track", on_delete=models.CASCADE, related_name="playlist_items")
    position = models.PositiveIntegerField()
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_playlist_item"
        ordering = ["position"]
        unique_together = (("playlist", "position"),)
        indexes = [
            models.Index(fields=["playlist", "position"]),
            models.Index(fields=["track"]),
        ]

    def __str__(self) -> str:
        return f"{self.playlist_id}#{self.position} -> {self.track_id}"


class PlaylistCollaborator(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="collaborators")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collaborating_playlists",
    )
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_playlist_collaborator"
        ordering = ["-added_at"]
        unique_together = (("playlist", "user"),)
        indexes = [
            models.Index(fields=["playlist"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} <-> playlist:{self.playlist_id}"


class RecentSearch(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recent_searches",
    )
    query = models.CharField(max_length=120)
    searched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_recent_search"
        ordering = ["-searched_at"]
        unique_together = (("user", "query"),)
        indexes = [
            models.Index(fields=["user", "-searched_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.query}"


class SavedTrack(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_tracks",
    )
    track = models.ForeignKey("catalog.Track", on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_saved_track"
        ordering = ["-saved_at"]
        unique_together = (("user", "track"),)
        indexes = [
            models.Index(fields=["user", "-saved_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} liked track:{self.track_id}"


class SavedAlbum(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_albums",
    )
    album = models.ForeignKey("catalog.Album", on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_saved_album"
        ordering = ["-saved_at"]
        unique_together = (("user", "album"),)
        indexes = [
            models.Index(fields=["user", "-saved_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} liked album:{self.album_id}"


class FollowedArtist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followed_artists",
    )
    artist = models.ForeignKey("catalog.Artist", on_delete=models.CASCADE, related_name="followers")
    followed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "library_followed_artist"
        ordering = ["-followed_at"]
        unique_together = (("user", "artist"),)
        indexes = [
            models.Index(fields=["user", "-followed_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} follows artist:{self.artist_id}"
