from django.db import migrations, models


SOURCE_CHOICES = [
    ("jamendo", "Jamendo"),
    ("audius", "Audius"),
    ("yandex", "Yandex Music (unofficial)"),
]


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_track_search_vector_track_catalog_track_fts_idx"),
    ]

    operations = [
        migrations.AlterField(
            model_name="album",
            name="source",
            field=models.CharField(choices=SOURCE_CHOICES, db_index=True, max_length=16),
        ),
        migrations.AlterField(
            model_name="artist",
            name="source",
            field=models.CharField(choices=SOURCE_CHOICES, db_index=True, max_length=16),
        ),
        migrations.AlterField(
            model_name="track",
            name="source",
            field=models.CharField(choices=SOURCE_CHOICES, db_index=True, max_length=16),
        ),
    ]
