"""
Taken from https://github.com/edsu/django-sugar/raw/c699e113a9cb32fc1199dda5d4a3b889d0c87f4e/sugar/middleware/cors.py
"""

from django.conf import settings

#: By default we'll set CORS Allow Origin * for all application/json responses
DEFAULT_CORS_PATHS = (
    ('/', ('application/json', ), (('Access-Control-Allow-Origin', '*'), ('Access-Control-Allow-Headers', '*'), )),
)

class CORSMiddleware(object):
    """
    Middleware that serves up representations with a CORS header to
    allow third parties to use your web api from JavaScript without
    requiring them to proxy it.
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