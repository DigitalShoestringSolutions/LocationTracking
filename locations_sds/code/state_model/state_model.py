import zmq
import json
import threading
from state.models import State, Event
from datetime import datetime
import dateutil.parser
from django.db import transaction

context = zmq.Context()

class StateModel:
    def __init__(self,zmq_config):
        self.subsocket = context.socket(zmq.SUB)
        self.subsocket.connect(zmq_config['pub_ep'])
        self.subsocket.setsockopt(zmq.SUBSCRIBE, zmq_config['inbound_topic'].encode())

        self.pushsocket = context.socket(zmq.PUSH)
        self.pushsocket.connect(zmq_config['sub_ep'])


    def start(self):
        t = threading.Thread(target = self.run)
        t.start()

    def run(self):
        while True:
            msg = self.subsocket.recv_multipart()
            print("StateModel got:",msg)
            try:
                topic = msg[-2].decode().split('/')
                json_msg = json.loads(msg[-1])
                self.handle_message(json_msg)
            except Exception as e:
                print("ERROR")
                print(e.msg)

    def handle_message(self,raw_msg):
        print(f"handling: {raw_msg}")
        #listen for incoming events
        try:
            #validate
            timestamp = dateutil.parser.isoparse(raw_msg['timestamp'])
            loc_link_from = raw_msg.get('from',None)
            loc_link_to = raw_msg['to']
            item_id = raw_msg['item']
            quantity = raw_msg.get('quantity',None)

            #log event
            event = Event.objects.create(item_id=item_id,from_location_link=loc_link_from,to_location_link=loc_link_to,quantity=quantity,timestamp=timestamp)
            
            if loc_link_from == loc_link_to:
                return
            
            # check item individual or collection?

            if event.quantity is not None and event.from_location_link is not None:  
                output = update_collection(event)
            else:
                output = update_individual(event)
            
            #send update
            for msg in output:
                self.pushsocket.send_multipart([msg["topic"].encode(),json.dumps(msg["payload"]).encode()])

        except Exception as e:
            print("ERROR")
            print (e)

def update_collection(event):
    output_messages = []
    with transaction.atomic():
        try:
            prevFromState = State.objects.get(location_link__exact=event.from_location_link,item_id__exact=event.item_id,end__isnull=True)
            prevFromState.end = event.timestamp
            prevFromQuantity = prevFromState.quantity
            prevFromState.save()
        except State.DoesNotExist:
            prevFromQuantity=0

        # can check quantity rather than deliberate exception on singel tracked
        try:
            prevToState = State.objects.get(location_link__exact=event.to_location_link,item_id__exact=event.item_id,end__isnull=True)
            prevToState.end = event.timestamp
            prevToQuantity=prevToState.quantity
            prevToState.save()
        except State.DoesNotExist:
            prevToQuantity=0
        
        newToQuantity = increment_quantity(prevToQuantity,event.quantity)
        newFromQuantity = decrement_quantity(prevFromQuantity,event.quantity)
        
        print(f"{event.from_location_link}:{prevFromQuantity}>{newFromQuantity},{event.to_location_link}:{prevToQuantity}>{newToQuantity}")

        newToState = State.objects.create(item_id=event.item_id,location_link=event.to_location_link,start=event.timestamp,quantity=newToQuantity)
        if newFromQuantity:
            newFromState = State.objects.create(item_id=event.item_id,location_link=event.from_location_link,start=event.timestamp,quantity=newFromQuantity)

    #send update event
    to_update_msg = {
            'item_id':newToState.item_id,
            'location_link':newToState.location_link,
            'timestamp':newToState.start.isoformat(),
            'quantity':newToState.quantity
            }

    print(to_update_msg)
    #send update
    output_messages.append({"topic":"location_state/update/"+to_update_msg['location_link'],"payload":to_update_msg})

        
    from_update_msg = {
        'item_id':event.item_id,
        'location_link':event.from_location_link,
        'timestamp':event.timestamp.isoformat(),
        'quantity':newFromQuantity
        }
    print(from_update_msg)
    output_messages.append({"topic":"location_state/update/"+from_update_msg['location_link'],"payload":from_update_msg})

    return output_messages

def update_individual(event):
    output_messages = []
    with transaction.atomic():
        try:
            prevState = State.objects.get(item_id__exact=event.item_id,end__isnull=True)
            
            if prevState.location_link == event.to_location_link:
                return []

            prevState.end = event.timestamp
            prevState.save()

            exited_msg = {
                'item_id':prevState.item_id,
                'location_link':prevState.location_link,
                'timestamp':prevState.end.isoformat(),
                'event':'exited'
                }

            print(exited_msg)
            #send update
            output_messages.append({"topic":"location_state/exited/"+exited_msg['location_link'],"payload":exited_msg})

        except State.DoesNotExist:
            pass

        newState = State.objects.create(item_id=event.item_id,location_link=event.to_location_link,start=event.timestamp)

    entered_msg = {
        'item_id':newState.item_id,
        'location_link':newState.location_link,
        'timestamp':newState.start.isoformat(),
        'event':'entered'
        }

    print(entered_msg)
    #send update
    output_messages.append({"topic":"location_state/entered/"+entered_msg['location_link'],"payload":entered_msg})

    return output_messages

def increment_quantity(base,amount):
    if base is None:
        return amount
    if amount is None:
        return base
    return base + amount

def decrement_quantity(base,amount):
    if base is None:
        return -1 * amount
    if amount is None:
        return base
    return base - amount
