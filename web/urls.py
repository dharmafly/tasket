from django.conf.urls.defaults import *
from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),

    # Tasks:
    (r'', include('tasks.urls')),
    
    # Frontend
    (r'', include('frontend.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

)


if settings.DEBUG:
  urlpatterns += patterns('django.views',
      (r'^media/(?P<path>.*)$', 'static.serve',
      {'document_root': settings.MEDIA_ROOT}),

)
