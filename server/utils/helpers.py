import json

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from cbv import View

def AllowJSONPCallback(function=None):
    """
    Partly ripped from http://djangosnippets.org/snippets/2208/
    
    Modified by Sym Roe to work with class based views and @method_decorator
    """

    f = function
    def wrapper(*args, **kwargs):
        request = args[0]
        callback = request.GET.get('callback')
        if callback:
            response = f(*args, **kwargs)
            if response.status_code / 100 != 2:
                response.content = 'error'
            if response.content[0] not in ['"', '[', '{'] \
                                or response.content[-1] not in ['"', ']', '}']:
                response.content = '"%s"' % response.content
            response.content = "%s(%s)" % (callback, response.content)
            response['Content-Type'] = 'application/javascript'
                    
        else:
            response = f(*args, **kwargs)
            
        return response
            
    return wrapper


class classonlymethod(classmethod):
    def __get__(self, instance, owner):
        if instance is not None:
            raise AttributeError("This method is available only on the view class.")
        return super(classonlymethod, self).__get__(instance, owner)



class PutView(View):
    """
    Generic base for class based views.

    Partly lifted from django 1.3.
    """
    
    def dispatch(self, request, *args, **kwargs):
        """
        Try to dispatch to the right method; if a method doesn't exist,
        defer to the error handler. Also defer to the error handler if the
        request method isn't on the approved list.
        """

        # If OPTIONS isn't in the http_method_names, add it and set up the 
        # default dispatcher
        self.http_method_names.append('options')
        if request.method.lower() in self.http_method_names:
            method = request.method.lower()
            handler = getattr(self, method,
                              self.http_method_not_allowed)
        else:
            handler = self.http_method_not_allowed
        self.request = request
        self.args = args
        self.kwargs = kwargs
        return handler(request, *args, **kwargs)

    def options(self, request, *args, **kwargs):
        return HttpResponse()

    @classonlymethod
    def as_view(cls, **initkwargs):
        """
        Main entry point for a request-response process.
        """

        def view(request, *args, **kwargs):
            self = cls(**initkwargs)
            request = self.clean_request(request)
            return self.dispatch(request, *args, **kwargs)

        return view

    def clean_request(self, request):
        """
        Adds 'PUT' to a request object.  Assumes valid JSON as the content of 
        the PUT request.
        """
        if request.method in ('PUT',):
            request.PUT = json.loads(request.raw_post_data)
        
        if 'CONTENT_TYPE' in request.META:
            if 'application/json' in request.META['CONTENT_TYPE'].split(';'):
                try:
                    request.JSON = json.loads(request.raw_post_data)
                except:
                    request.JSON = None
        
        return request

