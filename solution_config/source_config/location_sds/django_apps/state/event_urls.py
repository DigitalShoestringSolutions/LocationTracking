from django.urls import path,include
from rest_framework import routers
from . import views
# from django.shortcuts import redirect

# def redirect_root(request):
#     response = redirect('jobs/')
#     return response


urlpatterns= [ 
        path('',views.getAllEvents),
        path('for/<str:item_id>',views.eventsForItem),
        path('to/<str:location_link>',views.eventsToLocLink),
        path('from/<str:location_link>',views.eventsFromLocLink),
        path('at/<str:location_link>',views.eventsAtLocLink),
    ]

#/events/                           ?from=timestamp ?to=timestamp
#/events/for/<item_id>              ?from=timestamp ?to=timestamp
#/events/to/<loc_id>                ?from=timestamp ?to=timestamp
#/events/from/<loc_id>              ?from=timestamp ?to=timestamp
#/events/at/<loc_id>                ?from=timestamp ?to=timestamp
