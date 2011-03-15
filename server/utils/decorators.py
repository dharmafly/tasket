import json

from django.http import HttpResponse
from django.conf import settings

def default_403_response(request, *args, **kwargs):
    res = {
           "status": 403,
           "error": "Forbidden"
       }
    return HttpResponse(json.dumps(res), status=403)


def json_login_required(orig=None):
    
    response = getattr(settings, 'JSON_403_RESPONSE_VIEW', default_403_response)
    
    def wrapped(request, *args, **kwargs):
        if request.user.is_authenticated():
            return orig(request, *args, **kwargs)
        else:
            return response(request, *args, **kwargs)
    return wrapped


# This doesn't work on class based views yet, due to 
# django.utils.decorators.method_decorator.
# See http://code.djangoproject.com/ticket/13879

# class json_login_required():
#     """
#     Allows swapping out the responce function per call
#     """
#     
#     def __init__(self, response=None):
#         if not response: response = self.default_response
#         self.response = response
#         
#     def default_response():
#         res = {
#             'loggedin' : False,
#         }
#         return HttpResponse(res, status=403)
#     
#     def __call__(self, orig):
#         self.orig = orig
# 
#         def wrapped(request, *args, **kwargs):
#             if request.user.is_authenticated():
#                 return self.orig(request, *args, **kwargs)
#             else:
#                 return self.response()
#         return wrapped