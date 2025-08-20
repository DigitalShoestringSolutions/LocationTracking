from rest_framework import serializers

from .models import State, TransferEvent, ProductionEvent, ProductionEventInput

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model=State
        fields = ('record_id','item_id','location_link',"start","end","quantity")

    # def to_representation(self, obj):
    # rep = super().to_representation(obj)
    # rep['location'] = rep['location']['name']
    # return rep


class TransferEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferEvent
        fields = (
            "event_id",
            "item_id",
            "from_location_link",
            "to_location_link",
            "timestamp",
            "quantity",
        )


class ProductionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionEvent
        fields = (
            "event_id",
            "item_id",
            "location_link",
            "timestamp",
            "quantity",
        )


class ProductionEventInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionEventInput
        fields = (
            "item_id",
            "location_link",
            "production_event",
            "quantity",
            "timestamp",
        )
