from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

class AllowJSONPCallback(object):
    """This decorator function wraps a normal view function                                                                                      
    so that it can be read through a jsonp callback.                                                                                             
                                                                                                                                                 
    Usage:                                                                                                                                       
                                                                                                                                                 
    @AllowJSONPCallback                                                                                                                          
    def my_view_function(request):                                                                                                               
        return HttpResponse('this should be viewable through jsonp')                                                                             
                                                                                                                                                 
    It looks for a GET parameter called "callback", and if one exists,                                                                           
    wraps the payload in a javascript function named per the value of callback.                                                                  
                                                                                                                                                 
    Using AllowJSONPCallback implies that the user must be logged in                                                                             
    (and applies automatically the login_required decorator).                                                                                    
    If callback is passed and the user is logged out, "notLoggedIn" is                                                                           
    returned instead of a normal redirect, which would be hard to interpret                                                                      
    through jsonp.                                                                                                                               
                                                                                                                                                 
    If the input does not appear to be json, wrap the input in quotes                                                                            
    so as not to throw a javascript error upon receipt of the response."""

    def __call__(self, *args, **kwargs):
        request = args[0]
        callback = request.GET.get('callback')
        # if callback parameter is present,                                                                                                      
        # this is going to be a jsonp callback.                                                                                                  
        if callback:
            try:
                response = self.f(*args, **kwargs)
            except Exception, e:
                print e
                response = HttpResponse(e, status=500)
            if response.status_code / 100 != 2:
                response.content = 'error'
            if response.content[0] not in ['"', '[', '{'] \
                    or response.content[-1] not in ['"', ']', '}']:
                response.content = '"%s"' % response.content
            response.content = "%s(%s)" % (callback, response.content)
            response['Content-Type'] = 'application/javascript'
        else:
            response = self.f(*args, **kwargs)
        return response

WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__doc__')
WRAPPER_UPDATES = ('__dict__',)
def update_wrapper(wrapper,
                   wrapped,
                   assigned = WRAPPER_ASSIGNMENTS,
                   updated = WRAPPER_UPDATES):
    """Update a wrapper function to look like the wrapped function

       wrapper is the function to be updated
       wrapped is the original function
       assigned is a tuple naming the attributes assigned directly
       from the wrapped function to the wrapper function (defaults to
       functools.WRAPPER_ASSIGNMENTS)
       updated is a tuple naming the attributes off the wrapper that
       are updated with the corresponding attribute from the wrapped
       function (defaults to functools.WRAPPER_UPDATES)
    """
    for attr in assigned:
        setattr(wrapper, attr, getattr(wrapped, attr))
    for attr in updated:
        getattr(wrapper, attr).update(getattr(wrapped, attr))
    # Return the wrapper so this can be used as a decorator via curry()
    return wrapper


class classonlymethod(classmethod):
    def __get__(self, instance, owner):
        if instance is not None:
            raise AttributeError("This method is available only on the view class.")
        return super(classonlymethod, self).__get__(instance, owner)



class View(object):
    """
    Generic base for class based views.

    Partly lifted from django 1.3.
    """

    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options', 'trace']

    def __init__(self, **kwargs):
            """
            Constructor. Called in the URLconf; can contain helpful extra
            keyword arguments, and other things.
            """
            # Go through keyword arguments, and either save their values to our
            # instance, or raise an error.
            for key, value in kwargs.iteritems():
                setattr(self, key, value)


    @classonlymethod
    def as_view(cls, **initkwargs):
        """
        Main entry point for a request-response process.
        """

        # sanitize keyword arguments
        for key in initkwargs:
            if key in cls.http_method_names:
                raise TypeError(u"You tried to pass in the %s method name as a "
                                u"keyword argument to %s(). Don't do that."
                                % (key, cls.__name__))
            if not hasattr(cls, key):
                raise TypeError(u"%s() received an invalid keyword %r" % (
                    cls.__name__, key))


        def view(request, *args, **kwargs):
            self = cls(**initkwargs)
            request = self.clean_request(request)
            return self.dispatch(request, *args, **kwargs)

        # take name and docstring from class
        update_wrapper(view, cls, updated=())

        # and possible attributes set by decorators
        # like csrf_exempt from dispatch
        update_wrapper(view, cls.dispatch, assigned=())

        return view

    def clean_request(self, request):
        """
        Adds 'PUT' to a request ovject.  Assumes valid JSON as the content of 
        the PUT request.
        """
        if request.method in ('PUT',):
            request.PUT = json.loads(request.raw_post_data)
        return request

    def dispatch(self, request, *args, **kwargs):
        # Try to dispatch to the right method; if a method doesn't exist,
        # defer to the error handler. Also defer to the error handler if the
        # request method isn't on the approved list.
        if request.method.lower() in self.http_method_names:
            handler = getattr(self, request.method.lower(), self.http_method_not_allowed)
        else:
            handler = self.http_method_not_allowed
        self.request = request
        self.args = args
        self.kwargs = kwargs
        return handler(request, *args, **kwargs)

    def http_method_not_allowed(self, request, *args, **kwargs):
            allowed_methods = [m for m in self.http_method_names if hasattr(self, m)]
            logger.warning(
                'Method Not Allowed (%s): %s' % (request.method, request.path),
                extra={
                    'status_code': 405,
                    'request': self.request
                }
            )
            return http.HttpResponseNotAllowed(allowed_methods)
