from rest_framework import serializers


class ProductionOperationInputs(serializers.Serializer):
    item = serializers.CharField(source="item_id", max_length=32)
    quantity = serializers.IntegerField(required=False)
    loc = serializers.CharField(source="location_link", max_length=32, required=False)


class ProductionOperation(serializers.Serializer):
    """
    topic: production_operation/<location>
    Expected format:
    {
        "timestamp":"<iso8601>",
        "item":"<item_id>",         # item produced
        "quantity":"<int>",         # quantity of item produced - optional, not present if item is individually tracked
        "loc": "<loc_id>",          # location that item(s) are produced to
        "inputs": [
            {
                "item":"<item_id>",
                "loc":"<loc_id>",   # optional - if not present use output location
                "quantity":"<int>"  # optional - not present if item is individually tracked
            }
        ]
    }
    """

    timestamp = serializers.DateTimeField("iso-8601")
    item = serializers.CharField(source="item_id", max_length=32)
    quantity = serializers.IntegerField(required=False)
    loc = serializers.CharField(source="location_link", max_length=32)
    inputs = ProductionOperationInputs(many=True)


class TransferOperation(serializers.Serializer):
    """
    topic:
        transfer_operation/<to_location>
        transfer_operation/<to_location>/<from_location>
    Expected format:
    {
        "timestamp":"<iso8601>",
        "item":"<item_id>",            # item transferred
        "quantity":"<int>",            # quantity of item transferred - optional, not present if item is individually tracked
        "to_loc": "<loc_id>",          # location that item(s) are transferred to
        "from_loc":"<loc_id>"          # location that item(s) are transferred from - not included for individually tracked items
    }
    """

    timestamp = serializers.DateTimeField("iso-8601")
    item = serializers.CharField(source="item_id", max_length=32)
    quantity = serializers.IntegerField(required=False)
    to_loc = serializers.CharField(source="to_location_link", max_length=32)
    from_loc = serializers.CharField(
        source="from_location_link", required=False, max_length=32
    )
