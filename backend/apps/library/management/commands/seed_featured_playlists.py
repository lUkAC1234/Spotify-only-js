from dataclasses import dataclass

from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Source, Track
from apps.catalog.services import CatalogSyncService
from apps.library.services import (
    derive_playlist_cover,
    upsert_system_playlist,
)


@dataclass(frozen=True)
class FeaturedSeed:
    title: str
    description: str
    tag: str
    sort_order: int
    track_limit: int = 24
    source: str = Source.JAMENDO


FEATURED_SEEDS: tuple[FeaturedSeed, ...] = (
    FeaturedSeed(
        title="Today's Top Hits",
        description="The biggest indie hits across the catalog right now.",
        tag="pop",
        sort_order=10,
    ),
    FeaturedSeed(
        title="Chill Vibes",
        description="Laid-back grooves to take it slow.",
        tag="chillout",
        sort_order=20,
    ),
    FeaturedSeed(
        title="Electronic Edge",
        description="Synth-driven cuts and dancefloor staples.",
        tag="electronic",
        sort_order=30,
    ),
    FeaturedSeed(
        title="Rock Anthems",
        description="Distortion, drive, and unforgettable choruses.",
        tag="rock",
        sort_order=40,
    ),
    FeaturedSeed(
        title="Acoustic Mornings",
        description="Stripped-down songwriting to start the day.",
        tag="acoustic",
        sort_order=50,
    ),
    FeaturedSeed(
        title="Hip-Hop Underground",
        description="Beats and bars from independent voices.",
        tag="hiphop",
        sort_order=60,
    ),
    FeaturedSeed(
        title="Jazz After Hours",
        description="Smoky, late-night jazz cuts.",
        tag="jazz",
        sort_order=70,
    ),
    FeaturedSeed(
        title="Classical Focus",
        description="Calm orchestral and piano works for deep work.",
        tag="classical",
        sort_order=80,
    ),
    FeaturedSeed(
        title="World Sounds",
        description="Music from across continents and traditions.",
        tag="worldmusic",
        sort_order=90,
    ),
    FeaturedSeed(
        title="Reggae Roots",
        description="Slow grooves, sun-drenched melodies.",
        tag="reggae",
        sort_order=100,
    ),
    FeaturedSeed(
        title="Latin Heat",
        description="Latin rhythms, salsa, bossa, and more.",
        tag="latin",
        sort_order=110,
    ),
    FeaturedSeed(
        title="Ambient Drift",
        description="Textures, drones, and slow soundscapes.",
        tag="ambient",
        sort_order=120,
    ),
    FeaturedSeed(
        title="Dance Floor",
        description="Energy from house, techno, and everything between.",
        tag="dance",
        sort_order=130,
    ),
    FeaturedSeed(
        title="Metal Forge",
        description="Riffs, blasts, and breakdowns.",
        tag="metal",
        sort_order=140,
    ),
    FeaturedSeed(
        title="Folk Notebook",
        description="Storytellers, banjos, and harmonies.",
        tag="folk",
        sort_order=150,
    ),
    FeaturedSeed(
        title="Audius Trending: Electronic",
        description="What's hot on Audius this month — electronic & beat-driven.",
        tag="Electronic",
        sort_order=200,
        source=Source.AUDIUS,
    ),
    FeaturedSeed(
        title="Audius Trending: Hip-Hop",
        description="Trending hip-hop from independent Audius artists.",
        tag="Hip-Hop/Rap",
        sort_order=210,
        source=Source.AUDIUS,
    ),
)


class Command(BaseCommand):
    help = "Seed system-owned featured playlists from Jamendo by tag."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--tag",
            type=str,
            default=None,
            help="Seed a single tag instead of the full set.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Override per-playlist track limit.",
        )

    def handle(self, *args, **options) -> None:
        sync = CatalogSyncService()

        seeds = FEATURED_SEEDS
        if options.get("tag"):
            wanted = options["tag"].strip().lower()
            seeds = tuple(seed for seed in FEATURED_SEEDS if seed.tag == wanted)
            if not seeds:
                raise CommandError(f"Unknown tag: {options['tag']}")

        for seed in seeds:
            limit = options.get("limit") or seed.track_limit
            self.stdout.write(
                self.style.NOTICE(
                    f"Seeding '{seed.title}' (source={seed.source}, tag={seed.tag}, limit={limit})..."
                )
            )
            tracks = self._fetch_tracks_for_tag(sync, seed, limit=limit)
            if not tracks:
                self.stdout.write(self.style.WARNING(f"  no tracks for '{seed.tag}', skipping"))
                continue
            cover = derive_playlist_cover(tracks)
            playlist = upsert_system_playlist(
                title=seed.title,
                description=seed.description,
                cover=cover,
                sort_order=seed.sort_order,
                tracks=tracks,
            )
            self.stdout.write(
                self.style.SUCCESS(f"  '{playlist.title}' <- {len(tracks)} tracks")
            )

    def _fetch_tracks_for_tag(
        self,
        sync: CatalogSyncService,
        seed: FeaturedSeed,
        *,
        limit: int,
    ) -> list[Track]:
        try:
            return sync.tracks_by_tag(seed.tag, source=seed.source, limit=limit)
        except ImproperlyConfigured as exc:
            self.stdout.write(self.style.WARNING(f"  {seed.source} not configured: {exc}"))
            return []
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  upstream call failed: {exc}"))
            return []
