from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    FollowedArtist,
    Playlist,
    PlaylistCollaborator,
    PlaylistItem,
    RecentSearch,
    SavedAlbum,
    SavedTrack,
)


class PlaylistItemInline(TabularInline):
    model = PlaylistItem
    extra = 0
    autocomplete_fields = ("track",)
    fields = ("position", "track", "added_by", "added_at")
    readonly_fields = ("added_at",)


class PlaylistCollaboratorInline(TabularInline):
    model = PlaylistCollaborator
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "added_at")
    readonly_fields = ("added_at",)


@admin.register(Playlist)
class PlaylistAdmin(ModelAdmin):
    list_display = ("title", "owner", "is_system", "is_public", "is_collaborative", "sort_order", "updated_at")
    list_filter = ("is_system", "is_public", "is_collaborative")
    search_fields = ("title", "slug", "owner__username")
    autocomplete_fields = ("owner",)
    readonly_fields = ("created_at", "updated_at", "cover_mosaic")
    inlines = [PlaylistItemInline, PlaylistCollaboratorInline]


@admin.register(PlaylistItem)
class PlaylistItemAdmin(ModelAdmin):
    list_display = ("playlist", "position", "track", "added_at")
    list_filter = ("playlist__is_system",)
    search_fields = ("playlist__title", "track__title")
    autocomplete_fields = ("playlist", "track", "added_by")
    readonly_fields = ("added_at",)


@admin.register(PlaylistCollaborator)
class PlaylistCollaboratorAdmin(ModelAdmin):
    list_display = ("playlist", "user", "added_at")
    autocomplete_fields = ("playlist", "user")
    readonly_fields = ("added_at",)


@admin.register(RecentSearch)
class RecentSearchAdmin(ModelAdmin):
    list_display = ("user", "query", "searched_at")
    search_fields = ("user__username", "query")
    autocomplete_fields = ("user",)
    readonly_fields = ("searched_at",)
    date_hierarchy = "searched_at"


@admin.register(SavedTrack)
class SavedTrackAdmin(ModelAdmin):
    list_display = ("user", "track", "saved_at")
    autocomplete_fields = ("user", "track")
    readonly_fields = ("saved_at",)
    date_hierarchy = "saved_at"


@admin.register(SavedAlbum)
class SavedAlbumAdmin(ModelAdmin):
    list_display = ("user", "album", "saved_at")
    autocomplete_fields = ("user", "album")
    readonly_fields = ("saved_at",)
    date_hierarchy = "saved_at"


@admin.register(FollowedArtist)
class FollowedArtistAdmin(ModelAdmin):
    list_display = ("user", "artist", "followed_at")
    autocomplete_fields = ("user", "artist")
    readonly_fields = ("followed_at",)
    date_hierarchy = "followed_at"
