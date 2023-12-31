# Generated by Django 3.2.16 on 2023-10-12 09:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('state', '0002_auto_20231001_2211'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('event_id', models.BigAutoField(primary_key=True, serialize=False)),
                ('item_id', models.CharField(max_length=32)),
                ('from_location_link', models.CharField(blank=True, max_length=32, null=True)),
                ('to_location_link', models.CharField(max_length=32)),
                ('quantity', models.IntegerField(blank=True, null=True)),
                ('timestamp', models.DateTimeField()),
            ],
        ),
    ]
