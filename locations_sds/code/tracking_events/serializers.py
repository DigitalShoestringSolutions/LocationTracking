# serializers.py

from rest_framework import serializers

from .models import TrackingEvent

class TrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=TrackingEvent
        fields = '__all__'
