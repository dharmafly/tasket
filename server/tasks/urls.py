# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
    # Hub Methods
    # url(r'^foo/$', views.foo),
    url(r'^hubs/(?P<hub_id>\d+)/$',views.HubView.as_view()),
    url(r'^hubs/(?P<hub_id>\d+)/(?P<tasks>tasks)/$',views.HubView.as_view(), name="hub_tasks"),
    url(r'^hubs/$',views.HubView.as_view(), name="hubs"),
    # 
    # # Task Methods
    url(r'^tasks/$',views.TasksView.as_view(), name="task"),
    url(r'^tasks/(?P<task_id>\d+)/$',views.TasksView.as_view(), name="task"),
    
    
    # url(r'^example/(?P<hub_id>\d+)/$',views.ExampleView.as_view(), name="task"),
   )
