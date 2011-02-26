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
        Adds 'PUT' to a request ovject.  Assumes valid JSON as the content of 
        the PUT request.
        """
        if request.method in ('PUT',):
            request.PUT = json.loads(request.raw_post_data)
        return request

