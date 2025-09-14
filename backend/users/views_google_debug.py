from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import requests
import json

@api_view([POST])
@permission_classes([AllowAny])
def google_auth_debug(request):
    "
    Vista para depurar autenticación con Google OAuth
    "
    try:
        print(Recibido
