from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Source(models.TextChoices):
    JAMENDO = "jamendo", "Jamendo"
    AUDIUS = "audius", "Audius"


class AlbumType(models.TextChoices):
    ALBUM = "album", "Album"
    SINGLE = "single", "Single"
    EP = "ep", "EP"
    COMPILATION = "compilation", "Compilation"


def _slugify_unique(model: type[models.Model], base: str, ignore_pk: int | None = None) -> str:
    base_slug = slugify(base) or "item"
    candidate = base_slug
    suffix = 2
    qs = model.objects.all()
    if ignore_pk:
        qs = qs.exclude(pk=ignore_pk)
    while qs.filter(slug=candidate).exists():
        candidate = f"{base_slug}-{suffix}"
        suffix += 1
    return candidate


class Artist(models.Model):
    source = models.CharField(max_length=16, choices=Source.choices, db_index=True)
    source_id = models.CharField(max_length=128, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    bio = models.TextField(blank=True)
    image = models.URLField(max_length=500, blank=True)
    country = models.CharField(max_length=80, blank=True)
    monthly_listeners = models.PositiveIntegerField(default=0)
    metadata_synced_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_artist"
        unique_together = (("source", "source_id"),)
        indexes = [
            models.Index(fields=["source", "source_id"]),
            models.Index(fields=["name"]),
        ]
        ordering = ["name"]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _slugify_unique(Artist, self.name, ignore_pk=self.pk)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Album(models.Model):
    source = models.CharField(max_length=16, choices=Source.choices, db_index=True)
    source_id = models.CharField(max_length=128, db_index=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="albums")
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    release_date = models.DateField(null=True, blank=True)
    total_tracks = models.PositiveIntegerField(default=0)
    type = models.CharField(max_length=16, choices=AlbumType.choices, default=AlbumType.ALBUM)
    metadata_synced_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_album"
        unique_together = (("source", "source_id"),)
        indexes = [
            models.Index(fields=["source", "source_id"]),
            models.Index(fields=["title"]),
            models.Index(fields=["artist", "release_date"]),
        ]
        ordering = ["-release_date", "title"]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _slugify_unique(Album, self.title, ignore_pk=self.pk)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class Genre(models.Model):
    slug = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=80)

    class Meta:
        db_table = "catalog_genre"
        ordering = ["name"]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Track(models.Model):
    source = models.CharField(max_length=16, choices=Source.choices, db_index=True)
    source_id = models.CharField(max_length=128, db_index=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="tracks")
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, related_name="tracks", null=True, blank=True)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    track_number = models.PositiveIntegerField(null=True, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    explicit = models.BooleanField(default=False)
    bpm = models.PositiveIntegerField(null=True, blank=True)
    popularity = models.PositiveIntegerField(default=0)
    isrc = models.CharField(max_length=32, blank=True)
    is_unavailable = models.BooleanField(default=False)
    audio_url_cached = models.URLField(max_length=600, blank=True)
    audio_url_cached_at = models.DateTimeField(null=True, blank=True)
    metadata_synced_at = models.DateTimeField(default=timezone.now)
    search_vector = SearchVectorField(null=True, blank=True)
    genres = models.ManyToManyField(Genre, through="TrackGenre", related_name="tracks", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_track"
        unique_together = (("source", "source_id"),)
        indexes = [
            models.Index(fields=["source", "source_id"]),
            models.Index(fields=["title"]),
            models.Index(fields=["artist"]),
            models.Index(fields=["album", "track_number"]),
            models.Index(fields=["popularity"]),
            GinIndex(fields=["search_vector"], name="catalog_track_fts_idx"),
        ]
        ordering = ["-popularity", "title"]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _slugify_unique(Track, f"{self.title}-{self.artist_id or ''}", ignore_pk=self.pk)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class TrackGenre(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)

    class Meta:
        db_table = "catalog_track_genre"
        unique_together = (("track", "genre"),)
