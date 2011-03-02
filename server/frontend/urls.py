# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *
from django.conf import settings

import views

urlpatterns = patterns('',
    # Login
    url(r'^login/$',views.LoginView.as_view()),
    url(r'^logout/$',views.LogoutView.as_view()),
    # url(r'^login/$',views.login_view),

    
   )