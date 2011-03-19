from django.utils.importlib import import_module
from django.utils.http import cookie_date
from django.utils.cache import patch_vary_headers
from django.conf import settings

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

        for path, types, headers in self.paths:
            if request.path.startswith(path) and content_type in types:
                for k, v in headers:
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
        else:
            # Copied from django.contrib.sessions.middleware.SessionMiddleware
            engine = import_module(settings.SESSION_ENGINE)
            session_key = request.COOKIES.get(settings.SESSION_COOKIE_NAME, None)
            request.session = engine.SessionStore(session_key)
        

    def process_response(self, request, response):
        """
        Taken from django.contrib.sessions.middleware.SessionMiddleware.
        
        Do *everything* like normal, but also set the Authorization header to the
        Session Id.
        
        ----
        If request.session was modified, or if the configuration is to save the
        session every time, save the changes and set a session cookie.
        """
        try:
            accessed = request.session.accessed
            modified = request.session.modified
        except AttributeError:
            pass
        else:
            if accessed:
                patch_vary_headers(response, ('Cookie',))
            if modified or settings.SESSION_SAVE_EVERY_REQUEST:
                if request.session.get_expire_at_browser_close():
                    max_age = None
                    expires = None
                else:
                    max_age = request.session.get_expiry_age()
                    expires_time = time.time() + max_age
                    expires = cookie_date(expires_time)
                # Save the session data and refresh the client cookie.
                request.session.save()
                response.set_cookie(settings.SESSION_COOKIE_NAME,
                        request.session.session_key, max_age=max_age,
                        expires=expires, domain=settings.SESSION_COOKIE_DOMAIN,
                        path=settings.SESSION_COOKIE_PATH,
                        secure=settings.SESSION_COOKIE_SECURE or None)
        
        response['Authorization'] = request.session.session_key
        
        return response
    