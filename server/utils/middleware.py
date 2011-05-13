import time

from django.utils.importlib import import_module
from django.utils.http import cookie_date
from django.utils.cache import patch_vary_headers
from django.conf import settings
from django.template.defaultfilters import title

#: By default we'll set CORS Allow Origin * for all application/json responses
DEFAULT_CORS_PATHS = (
    ('/', ('application/json', ), (('Access-Control-Allow-Origin', '*'), ('Access-Control-Allow-Headers', '*'), )),
)

class CORSMiddleware():
    """
    Middleware that serves up representations with a CORS header to
    allow third parties to use your web api from JavaScript without
    requiring them to proxy it.

    Taken from https://github.com/edsu/django-sugar/raw/c699e113a9cb32fc1199dda5d4a3b889d0c87f4e/sugar/middleware/cors.py
    """

    def __init__(self):
        self.paths = getattr(settings, "CORS_PATHS", DEFAULT_CORS_PATHS)

    def process_response(self, request, response):
        content_type = response.get('content-type', '').split(";")[0].lower()
        

        # Echo chamber.
        # TODO: move to it's own middleware at some point
        def fix_headers(header):
            """
            Note, because of WSGI mangling the headers, it's impossable to access
            the origional header names directly.
            Here we try to reconstruct them, but it will fail sometimes.
            """
            header = header[5:].lower().replace('_', '-')
            return title(header)
        
        AccessControlAllowHeaders = []
        for k,v in request.META.items():
            if k.startswith('HTTP_'):
                AccessControlAllowHeaders.append(fix_headers(k))
        
        if getattr(settings, 'CROSS_DOMAIN', False) == True:
            for path, types, headers in self.paths:
                if request.path.startswith(path) and content_type in types:
                    for k, v in headers:
                        if k == "Access-Control-Allow-Headers":
                            v = "%s, %s" % (v, ", ".join(AccessControlAllowHeaders))
                        response[k] = v
                    break
        return response


class CORSAuthorizationMiddleware():
    """
    Because Javscript can't set CORS cookies, we need to pass the sessionid about 
    using the 'Authorization' header.
    
    Replaces the session middleware.
    """
    
    def process_request(self, request):
        # If the 'Authorization' header exists, assume it contains a valid 
        # sessionid and set it *instead* of the cookie
        if request.META.get('HTTP_AUTHORIZATION'):
            engine = import_module(settings.SESSION_ENGINE)
            session_key = request.META.get('HTTP_AUTHORIZATION', None)
            request.session = engine.SessionStore(session_key)
        

    def process_response(self, request, response):
        try:
            response['Authorization'] = request.session.session_key
        except:
            pass
        
        return response
    
