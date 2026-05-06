from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Album, Artist, Genre, Track, TrackGenre


@admin.register(Artist)
class ArtistAdmin(ModelAdmin):
    list_display = ("name", "source", "country", "monthly_listeners", "updated_at")
    list_filter = ("source",)
    search_fields = ("name", "source_id")
    readonly_fields = ("created_at", "updated_at", "metadata_synced_at")


@admin.register(Album)
class AlbumAdmin(ModelAdmin):
    list_display = ("title", "artist", "type", "release_date", "total_tracks", "source")
    list_filter = ("source", "type")
    search_fields = ("title", "source_id", "artist__name")
    autocomplete_fields = ("artist",)
    readonly_fields = ("created_at", "updated_at", "metadata_synced_at")


@admin.register(Track)
class TrackAdmin(ModelAdmin):
    list_display = ("title", "artist", "album", "duration_ms", "popularity", "source")
    list_filter = ("source", "explicit", "is_unavailable")
    search_fields = ("title", "source_id", "artist__name", "album__title")
    autocomplete_fields = ("artist", "album")
    readonly_fields = ("created_at", "updated_at", "metadata_synced_at", "audio_url_cached_at")


@admin.register(Genre)
class GenreAdmin(ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


admin.site.register(TrackGenre)
