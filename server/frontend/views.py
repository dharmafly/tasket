# -*- coding: utf-8 -*-
import json

from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.forms import ValidationError
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm
from django.utils.http import base36_to_int
from django.contrib.auth.tokens import default_token_generator as token_generator

from utils.helpers import AllowJSONPCallback, PutView

from tasks.models import Profile

class LoginView(PutView):

    http_method_names = ['get','post',]

    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')

    def get(self, request):
        request.session.set_test_cookie()
        if request.user.is_authenticated():
            self.res.write(json.dumps(
                {
                    'logged_in' : True,
                    'user': request.user.profile.pk
                }
                ))
            return self.res
        
        form = AuthenticationForm(request)
        return render_to_response(
            'login.html',
            {
                'form' : form,
            },
            context_instance=RequestContext(request)
            )

    def post(self, request):
        request.session.set_test_cookie()
        form = AuthenticationForm(request, data=request.JSON)
        if form.is_valid():
            username = request.JSON['username']
            password = request.JSON['password']
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    
                    self.res.write(json.dumps(
                        {
                        'user' : user.profile.as_dict(request_user=user),
                        'sessionid' : request.session.session_key
                        }
                    ))
                    return self.res
        else:
            self.res.write(json.dumps(
                {
                'error' : "Unauthorized",
                'status' : 401
                }
            ))
            self.res.status_code = 401
            return self.res

class PasswordReset(PutView):
    """
    See https://github.com/premasagar/tasket/issues/219#issuecomment-1093011
    """
    http_method_names = ['post', 'get',]
    
    def get(self, request, uid, token):
        """
        Mainly ripped from django.contrib.auth.views.password_reset_confirm
        """
        
        try:
            uid_int = base36_to_int(uid)
            user = User.objects.get(pk=uid_int)
        except (ValueError, User.DoesNotExist):
            user = None
        
        if user is not None and token_generator.check_token(user, token):
            # Hack because we're not getting the password
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)
<<<<<<< HEAD
            return HttpResponseRedirect('/#/change-password/')
=======
            return HttpResponseRedirect('/#/users/%s/change-password/' % user.pk)
        return HttpResponseRedirect('/')
>>>>>>> master

    def post(self, request):
        try:
            user = User.objects.get(username=request.JSON.get('username'))
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=request.JSON.get('email'))
            except Exception, e:
                return HttpResponse()

        form = PasswordResetForm({'email' : user.email})
        if form.is_valid():
            form.save(email_template_name='password_reset_email.html')
        
        return HttpResponse()

class LogoutView(PutView):
    http_method_names = ['post',]

    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    
    def post(self, request):
        logout(request)
        
        if 'application/json' in request.META['CONTENT_TYPE']:
            self.res.write(json.dumps(
                {
                    'logged_out' : True,
                }
            ))
        else:
            self.res = HttpResponseRedirect(reverse('home'))
        
        self.res.delete_cookie('sessionid')
        return self.res
        
        

class RegisterView(PutView):
    http_method_names = ['post',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    

def handle404(request):
    res = HttpResponse()
    res.write(json.dumps(
        {
            'status': 404,
            'error': "Not Found"
        }
    ))
    res.status_code=404
    return res
    
    
    
    
def settings_view(request):
    exposed_settings = getattr(settings, "EXPOSED_SETTINGS", ())
    
    settings_dict = {}
    
    for setting in exposed_settings:
        if hasattr(settings, setting):
            settings_dict[setting] = getattr(settings, setting)
    
    return HttpResponse(json.dumps(settings_dict))


