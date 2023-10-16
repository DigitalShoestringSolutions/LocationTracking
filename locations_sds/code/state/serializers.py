from rest_framework import serializers

from .models import State, Event

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model=State
        fields = ('record_id','item_id','location_link',"start","end","quantity")

    # def to_representation(self, obj):
        # rep = super().to_representation(obj)
        # rep['location'] = rep['location']['name']
        # return rep

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ('event_id','item_id','from_location_link','to_location_link',"timestamp","quantity")


