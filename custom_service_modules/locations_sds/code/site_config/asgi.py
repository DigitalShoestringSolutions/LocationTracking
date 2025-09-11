import os
from channels.routing import ProtocolTypeRouter
from django.core.asgi import get_asgi_application
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'site_config.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
    }
)
import state_model.state_model
import shoestring_wrapper.wrapper

zmq_config = {
                'inbound_topic':'wrapper_in',
                'outbound_topic':'wrapper_out',
                'pub_ep':'tcp://127.0.0.1:6000',
                'sub_ep':'tcp://127.0.0.1:6001',
                }

shoestring_wrapper.wrapper.Wrapper.start({'zmq_config':zmq_config,'mqtt_config':settings.MQTT})
state_model.state_model.StateModel(zmq_config).start()
