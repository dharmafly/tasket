# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
   url(r'^$','django.views.generic.simple.direct_to_template', {'template' : 'test.html'}, name="all_tasks"),
   url(r'^alltasks/$',views.all_tasks, name="alltasks"),
   url(r'^task/$',views.task, name="node"),
   )
