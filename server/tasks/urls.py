# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *
from django.conf import settings

import views

urlpatterns = patterns('',
    # Home
    url(r'^$',views.home),

    # Hub Methods
    url(r'^hubs/(?P<hub_id>\d+)/$',views.HubView.as_view()),
    url(r'^hubs/(?P<hub_id>\d+)/(?P<tasks>tasks)/$',views.HubView.as_view(), name="hub_tasks"),
    url(r'^hubs/$',views.HubView.as_view(), name="hubs"),
    
    # Task Methods
    url(r'^tasks/$',views.TasksView.as_view(), name="task"),
    url(r'^tasks/(?P<task_id>\d+)/$',views.TasksView.as_view(), name="task"),
    
    # User Methods
    url(r'^users/$',views.ProfileView.as_view(), name="user"),
    url(r'^users/(?P<user_id>\d+)/$',views.ProfileView.as_view(), name="user"),
    
    
   )
if settings.DEBUG:
  urlpatterns += patterns('django.views',
      (r'^(?P<path>.*)$', 'static.serve',
      {'document_root': settings.MEDIA_ROOT}),

)
