import zmq
import json
import threading
from state.models import State, TransferEvent, ProductionEvent, ProductionEventInput
from datetime import datetime
import dateutil.parser
from django.db import transaction
from . import serializers
import traceback

context = zmq.Context()


class StateModel:
    def __init__(self, zmq_config):
        self.subsocket = context.socket(zmq.SUB)
        self.subsocket.connect(zmq_config["pub_ep"])
        self.subsocket.setsockopt(zmq.SUBSCRIBE, zmq_config["inbound_topic"].encode())

        self.pushsocket = context.socket(zmq.PUSH)
        self.pushsocket.connect(zmq_config["sub_ep"])

    def start(self):
        t = threading.Thread(target=self.run)
        t.start()

    def run(self):
        while True:
            msg = self.subsocket.recv_multipart()
            print("StateModel got:", msg)
            try:
                topic = msg[-2].decode().split("/")
                json_msg = json.loads(msg[-1])
                if topic[0] == "transfer_operation":
                    self.handle_transfer_op_message(json_msg)
                if topic[0] == "production_operation":
                    self.handle_prod_op_message(json_msg)
            except Exception as e:
                print("ERROR")
                print(traceback.format_exc())

    def handle_transfer_op_message(self, raw_msg):
        print(f"handling: {raw_msg}")
        # listen for incoming events
        try:
            # validate
            serializer = serializers.TransferOperation(data=raw_msg)
            serializer.is_valid(raise_exception=True)

            # log event
            event = TransferEvent(**serializer.validated_data)

            if event.from_location_link == event.to_location_link:
                return

            # check item individual or collection?

            if event.quantity is not None and event.from_location_link is not None:
                output = transfer_collection(event)
            else:
                output = transfer_individual(event)

            event.save()

            # send update(s)
            for msg in output:
                self.pushsocket.send_multipart(
                    [msg["topic"].encode(), json.dumps(msg["payload"]).encode()]
                )

        except Exception as e:
            print("ERROR")
            print(traceback.format_exc())

    def handle_prod_op_message(self, raw_msg):
        print(f"handling: {raw_msg}")
        # listen for incoming events
        try:
            # validate
            serializer = serializers.ProductionOperation(data=raw_msg)
            serializer.is_valid(raise_exception=True)

            prod_event_data = {**serializer.validated_data}
            prod_event_input_data = prod_event_data.pop("inputs", [])
            prod_event = ProductionEvent(**prod_event_data)
            print(prod_event_input_data)
            prod_event_inputs = [
                ProductionEventInput(
                    production_event=prod_event, **{"location_link":prod_event.location_link, **entry}
                )
                for entry in prod_event_input_data
            ]

            print(prod_event)
            print(prod_event_inputs)

            # check item individual or collection?
            if prod_event.quantity is not None:
                output = production_collection(prod_event, prod_event_inputs)
            else:
                output = production_individual(prod_event, prod_event_inputs)

            prod_event.save()
            for input in prod_event_inputs:
                input.save()

            # send update(s)
            for msg in output:
                self.pushsocket.send_multipart(
                    [msg["topic"].encode(), json.dumps(msg["payload"]).encode()]
                )

        except Exception as e:
            print("ERROR")
            print(e)


def transfer_collection(event):
    output_messages = []
    with transaction.atomic():
        to_update_msg = __increase_collection(
            event.item_id, event.to_location_link, event.location, event.timestamp
        )
        print(to_update_msg)
        output_messages.append(to_update_msg)

        from_update_msg = __reduce_collection(
            event.item_id, event.from_location_link, event.quantity, event.timestamp
        )
        print(from_update_msg)
        output_messages.append(from_update_msg)

    return output_messages


def transfer_individual(event):
    with transaction.atomic():
        prevState, _, output_messages = __transfer_individual(
            event.item_id,
            event.to_location_link,
            event.timestamp,
        )

        if prevState is not None:
            event.from_location_link = prevState.location_link

    return output_messages


def production_collection(event: ProductionEvent, inputs: list[ProductionEventInput]):
    all_output_messages = []
    with transaction.atomic():
        # increment output quantity
        update_msg = __increase_collection(
            event.item_id, event.location_link, event.quantity, event.timestamp
        )
        print(update_msg)
        # add to msg queue
        all_output_messages.append(update_msg)

        for input in inputs:
            if input.quantity is not None:  # if collection
                output_message = __reduce_collection(
                    input.item_id, input.location_link, input.quantity, event.timestamp
                )
                all_output_messages.append(output_message)
            else:
                _, _, output_messages = __transfer_individual(
                    input.item_id,
                    None,  # no way to continue tracking an individual item that got consumed to make a collection - I would be surprised if this happens in practice
                    event.timestamp,
                )
                all_output_messages.extend(output_messages)

    return all_output_messages


def production_individual(event: ProductionEvent, inputs: list[ProductionEventInput]):
    all_output_messages = []
    with transaction.atomic():
        
        _, produced_item, update_msgs = __transfer_individual(
            event.item_id, event.location_link, event.timestamp
        )
        print(update_msgs)
        # add to msg queue
        all_output_messages.extend(update_msgs)

        for input in inputs:
            if input.quantity is not None:  # if collection
                output_message = __reduce_collection(
                    input.item_id, input.location_link, input.quantity, event.timestamp
                )
                all_output_messages.append(output_message)
                output_message = __increase_collection(
                    input.item_id,
                    produced_item.item_id,
                    input.quantity,
                    event.timestamp,
                )
                all_output_messages.append(output_message)
            else:
                _, _, output_messages = __transfer_individual(
                    input.item_id,
                    produced_item.item_id,
                    event.timestamp,
                )
                all_output_messages.extend(output_messages)

    return all_output_messages


## PRIMITIVES


def __transfer_individual(item_id, to_loc, timestamp):
    output_messages = []
    try:

        prevState = State.objects.get(item_id__exact=item_id, end__isnull=True)

        if prevState.location_link == to_loc:
            return prevState, prevState, []

        prevState.end = timestamp
        prevState.save()

        exited_msg = {
            "topic": f"location_state/exited/{prevState.location_link}",
            "payload": {
                "item_id": item_id,
                "location_link": prevState.location_link,
                "timestamp": timestamp.isoformat(),
                "event": "exited",
            },
        }
        print(exited_msg)
        # send update
        output_messages.append(exited_msg)

    except State.DoesNotExist:
        prevState = None

    if to_loc is not None:
        newState = State.objects.create(
            item_id=item_id,
            location_link=to_loc,
            start=timestamp,
        )

        entered_msg = {
            "topic": f"location_state/entered/{newState.location_link}",
            "payload": {
                "item_id": newState.item_id,
                "location_link": newState.location_link,
                "timestamp": newState.start.isoformat(),
                "event": "entered",
            },
        }
        output_messages.append(entered_msg)
    else:
        newState = None
    return prevState, newState, output_messages


# Runs in an attomic transaction
def __reduce_collection(item_id, from_loc, quantity, timestamp):
    try:
        prevFromState = State.objects.get(
            location_link__exact=from_loc, item_id__exact=item_id, end__isnull=True
        )
        prevFromState.end = timestamp
        prevFromQuantity = prevFromState.quantity
        prevFromState.save()
    except State.DoesNotExist:
        prevFromQuantity = 0

    newFromQuantity = decrement_quantity(prevFromQuantity, quantity)

    if newFromQuantity:
        State.objects.create(
            item_id=item_id,
            location_link=from_loc,
            start=timestamp,
            quantity=newFromQuantity,
        )

    return {
        "topic": f"location_state/update/{from_loc}",
        "payload": {
            "item_id": item_id,
            "location_link": from_loc,
            "timestamp": timestamp.isoformat(),
            "quantity": newFromQuantity,
        },
    }


def __increase_collection(item_id, to_loc, quantity, timestamp):
    # can check quantity rather than deliberate exception on single tracked
    try:
        prevToState = State.objects.get(
            location_link__exact=to_loc, item_id__exact=item_id, end__isnull=True
        )
        prevToState.end = timestamp
        prevToQuantity = prevToState.quantity
        prevToState.save()
    except State.DoesNotExist:
        prevToQuantity = 0

    newToQuantity = increment_quantity(prevToQuantity, quantity)

    newToState = State.objects.create(
        item_id=item_id, location_link=to_loc, start=timestamp, quantity=newToQuantity
    )

    return {
        "topic": f"location_state/update/{newToState.location_link}",
        "payload": {
            "item_id": newToState.item_id,
            "location_link": newToState.location_link,
            "timestamp": newToState.start.isoformat(),
            "quantity": newToState.quantity,
        },
    }


def increment_quantity(base, amount):
    if base is None:
        return amount
    if amount is None:
        return base
    return base + amount


def decrement_quantity(base, amount):
    if base is None:
        return -1 * amount
    if amount is None:
        return base
    return base - amount
