class DeferredRenderingMiddleware(object):
    """
    Middleware that renders deferred rendered responses for Django < 1.3.
    """
    def process_response(self, request, response):
        try:
            if hasattr(response, 'render') and callable(response.render):
                return response.render()
            return response
        except Exception:
            import sys
            from django.conf import settings
            from django.core.handlers.base import BaseHandler
            from django.core import signals
            from django.core import urlresolvers

            urlconf = settings.ROOT_URLCONF
            urlresolvers.set_urlconf(urlconf)
            resolver = urlresolvers.RegexURLResolver(r'^/', urlconf)
            receivers = signals.got_request_exception.send(
                sender=self.__class__,
                request=request,
                )
            handler = BaseHandler()
            return handler.handle_uncaught_exception(
                request,
                resolver,
                sys.exc_info(),
                )