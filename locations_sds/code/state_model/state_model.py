import zmq
import json
import threading
from state.models import State
# from tracking_events.models import TrackingEvent
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
            loc_link_from = raw_msg['from']
            loc_link_to = raw_msg['to']
            item_id = raw_msg['item']
            quantity = raw_msg.get('quantity',None)
            
            if loc_link_from == loc_link_to:
                return

            #log event
            # te = TrackingEvent.objects.create(job_id=msg.job_id,location=msg.location.name,event_type=msg.event_type,timestamp=msg.timestamp) 
            
            #find previous
            with transaction.atomic():
                try:
                    prevFromState = State.objects.get(location_link__exact=loc_link_from,item_id__exact=item_id,end__isnull=True)
                    prevFromState.end = timestamp
                    prevFromQuantity = prevFromState.quantity
                    prevFromState.save()
                except State.DoesNotExist:
                    prevFromQuantity=0

                # can check quantity rather than deliberate exception on singel tracked
                try:
                    prevToState = State.objects.get(location_link__exact=loc_link_to,item_id__exact=item_id,end__isnull=True)
                    prevToState.end = timestamp
                    prevToQuantity=prevToState.quantity
                    prevToState.save()
                except State.DoesNotExist:
                    prevToQuantity=0
                
                newToQuantity = increment_quantity(prevToQuantity,quantity)
                newFromQuantity = decrement_quantity(prevFromQuantity,quantity)
                
                print(f"{loc_link_from}:{prevFromQuantity}>{newFromQuantity},{loc_link_to}:{prevToQuantity}>{newToQuantity}")

                newToState = State.objects.create(item_id=item_id,location_link=loc_link_to,start=timestamp,quantity=newToQuantity)
                if newFromQuantity and newFromQuantity != 0:
                    newFromState = State.objects.create(item_id=item_id,location_link=loc_link_from,start=timestamp,quantity=newFromQuantity)

            #send update event
            to_update_msg = {
                    'item_id':newToState.item_id,
                    'location_link':newToState.location_link,
                    'timestamp':newToState.start.isoformat(),
                    'quantity':newToState.quantity
                    }

            print(to_update_msg)
            #send update
            self.pushsocket.send_multipart(["location_state/update".encode(),json.dumps(to_update_msg).encode()])

            
            from_update_msg = {
                'item_id':item_id,
                'location_link':loc_link_from,
                'timestamp':timestamp.isoformat(),
                'quantity':newFromQuantity
                }
            print(from_update_msg)
            self.pushsocket.send_multipart(["location_state/update".encode(),json.dumps(from_update_msg).encode()])

        except Exception as e:
            print("ERROR")
            print (e)



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
