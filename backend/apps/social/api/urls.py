from django.urls import path

from .views import (
    FeedView,
    FollowToggleView,
    FollowersView,
    FollowingView,
    FriendsActivityView,
    PrivacyView,
    PublicPlaylistsView,
    PublicProfileView,
    RecapView,
)

app_name = "social"

urlpatterns = [
    path("users/<int:user_id>/", PublicProfileView.as_view(), name="user-profile"),
    path("users/<int:user_id>/playlists/", PublicPlaylistsView.as_view(), name="user-playlists"),
    path("users/<int:user_id>/follow/", FollowToggleView.as_view(), name="user-follow"),
    path("users/<int:user_id>/followers/", FollowersView.as_view(), name="user-followers"),
    path("users/<int:user_id>/following/", FollowingView.as_view(), name="user-following"),
    path("me/feed/", FeedView.as_view(), name="me-feed"),
    path("me/friends-activity/", FriendsActivityView.as_view(), name="me-friends-activity"),
    path("me/privacy/", PrivacyView.as_view(), name="me-privacy"),
    path("me/recap/", RecapView.as_view(), name="me-recap"),
]
