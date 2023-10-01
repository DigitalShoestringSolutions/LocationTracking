from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
import datetime
import dateutil.parser
import re

from .models import Identifier, IdentifierType, IdentifierPattern, IdentityEntry, IdentityType
from .serializers import IdentitySerializer, IdentitySerializerFull

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer))
def identify(request,identifier_type,identifier):
    full = request.GET.get("full",False)
    try:
        idfier_type = IdentifierType.objects.get(tag__exact=identifier_type)
    except IdentifierType.DoesNotExist:
        return Response({"reason":"Identifier Type Not Found"},status=status.HTTP_400_BAD_REQUEST)
    try:
        idfier = Identifier.objects.get(type__exact=idfier_type,value__exact=identifier)
        identity = idfier.target
        print(f"{identifier_type}:{identifier}>Found:{identity.get_id()}")
    except Identifier.DoesNotExist:
        for pattern_obj in idfier_type.patterns.all():
            pattern = re.compile(pattern_obj.pattern)
            match = pattern.match(identifier)
            if match:
                dataset = {**pattern_obj.defaults,**match.groupdict()}
                identity = IdentityEntry.objects.create(type=pattern_obj.id_type,**dataset)
                Identifier.objects.create(type=idfier_type,value=identifier,target=identity)
                print(f"{identifier_type}:{identifier}>Created:{identity.get_id()}")

    
    if full is not False:
        serializer = IdentitySerializerFull(identity)
    else:
        serializer = IdentitySerializer(identity)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer))
def listByIDType(request,id_type):
    full = request.GET.get("full",False)
    try:
        id_type = IdentityType.objects.get(tag__exact=id_type)
        qs = id_type.identities.all()
        if full is not False:
            serializer = IdentitySerializerFull(qs,many=True)
        else:
            serializer = IdentitySerializer(qs,many=True)
        return Response(serializer.data)

    except IdentityType.DoesNotExist:
        return Response({"reason":"Identity Type Not Found"},status=status.HTTP_400_BAD_REQUEST)




