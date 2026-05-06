from django.urls import path

from .views import PlaybackStateView, PlayEventView, StreamView

app_name = "playback"

urlpatterns = [
    path("stream/<int:track_id>/", StreamView.as_view(), name="stream"),
    path("playback/state/", PlaybackStateView.as_view(), name="state"),
    path("playback/play-event/", PlayEventView.as_view(), name="play-event"),
]
