# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
   url(r'^$',views.all_tasks, name="all_tasks"),
   url(r'^task/$',views.task, name="node"),      
   )
