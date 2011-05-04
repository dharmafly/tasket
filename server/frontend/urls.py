# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *
from django.conf import settings

import views

urlpatterns = patterns('',
    # Login
    url(r'^login/$',views.LoginView.as_view()),
    url(r'^logout/$',views.LogoutView.as_view()),
    url(r'^register/$',views.RegisterView.as_view()),
    url(r'^users/password-reset/$',views.PasswordReset.as_view()),
    url(r'^users/password-reset/(?P<uid>[^/]+)/(?P<token>.*)$',views.PasswordReset.as_view(), name="password_reset"),
    url(r'^settings/$',views.settings_view),
   )