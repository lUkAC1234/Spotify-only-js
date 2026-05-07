from django.core.management.base import BaseCommand

from apps.catalog.services import rebuild_all_track_search_vectors


class Command(BaseCommand):
    help = "Recompute the catalog_track.search_vector column for every track in the catalog."

    def handle(self, *args, **options) -> None:
        self.stdout.write(self.style.NOTICE("Rebuilding track search vectors..."))
        count = rebuild_all_track_search_vectors()
        self.stdout.write(self.style.SUCCESS(f"Rebuilt {count} track vectors."))
