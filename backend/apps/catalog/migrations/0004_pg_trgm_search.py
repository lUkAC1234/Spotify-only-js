import django.contrib.postgres.indexes
from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_alter_source_choices_yandex'),
    ]

    operations = [
        TrigramExtension(),
        migrations.AddIndex(
            model_name='track',
            index=django.contrib.postgres.indexes.GinIndex(
                fields=['title'],
                name='catalog_track_title_trgm',
                opclasses=['gin_trgm_ops'],
            ),
        ),
        migrations.AddIndex(
            model_name='artist',
            index=django.contrib.postgres.indexes.GinIndex(
                fields=['name'],
                name='catalog_artist_name_trgm',
                opclasses=['gin_trgm_ops'],
            ),
        ),
        migrations.AddIndex(
            model_name='album',
            index=django.contrib.postgres.indexes.GinIndex(
                fields=['title'],
                name='catalog_album_title_trgm',
                opclasses=['gin_trgm_ops'],
            ),
        ),
    ]
