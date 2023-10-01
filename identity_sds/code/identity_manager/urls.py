from django.urls import path,include
from rest_framework import routers
from . import views
from django.shortcuts import redirect

# def redirect_root(request):
#     response = redirect('jobs/')
#     return response


urlpatterns= [
        # path('',redirect_root), 
        path('list/<str:id_type>',views.listByIDType), 
        path('get/<str:identifier_type>/<str:identifier>',views.identify), 
    ]


# /id/list/<tag>    ?full
# /id/get/<identifier_type>/<identifier> ?full
### check Identifier List
### if found return id, desc, name
### if none, check against patterns
### if found
# /id/<id>

