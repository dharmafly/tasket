# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *
from django.conf import settings

import views

urlpatterns = patterns('',
    # Home
    url(r'^$',views.home, name="home"),

    # Hub Methods
    url(r'^hubs/(?P<hub_id>\d+)$',views.HubView.as_view()),
    url(r'^hubs/(?P<hub_id>\d+)/(?P<tasks>tasks)/$',views.HubView.as_view(), name="hub_tasks"),
    url(r'^hubs/(?P<hub_id>\d+)/(?P<image>image)/$',views.HubView.as_view(), name="hub_image"),
    url(r'^hubs/$',views.HubView.as_view(), name="hubs"),
    
    # Task Methods
    url(r'^tasks/$',views.TasksView.as_view(), name="task"),
    url(r'^tasks/(?P<task_id>\d+)$',views.TasksView.as_view(), name="task"),
    url(r'^tasks/(?P<task_id>\d+)/(?P<image>image)/$',views.TasksView.as_view(), name="task_image"),
    
    # User Methods
    url(r'^users/$',views.ProfileView.as_view(), name="user"),
    url(r'^users/(?P<user_id>\d+)$',views.ProfileView.as_view(), name="user"),
    url(r'^users/(?P<user_id>\d+)/(?P<image>image)/$',views.ProfileView.as_view(), name="user_image"),
    url(r'^users/(?P<user_id>\d+)/(?P<starred>starred)/$',views.ProfileView.as_view(), name="user_starred"),
    
    # Starred Methods
    url(r'^starred/(?P<star_type>task|hub|profile)/(?P<object_id>\d+)/$',views.StarredView.as_view(), name="starred"),
    
    # Images
    url(r'^thumb/(?P<size>[^/]+)/(?P<path>.*)$',views.thumbs),

    # Statistics
    url(r'^statistics/$',views.statistics),
    
   )