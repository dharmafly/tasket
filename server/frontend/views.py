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

from utils.helpers import AllowJSONPCallback, PutView

from tasks.models import Profile

# def login_view(request):
#     form = AuthenticationForm(request, data=request.POST)
#     print form.errors
#     return render_to_response(
#         'login.html',
#         {
#             'form' : form,
#         },
#         context_instance=RequestContext(request)
#         )

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
                        'user' : user.profile.as_dict(),
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
            return self.res
                
                
                
class LogoutView(PutView):
    http_method_names = ['get',]

    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    
    def get(self, request):
        logout(request)
        self.res.write(json.dumps(
            {
                'logged_out' : True,
            }
        ))
        
        return self.res
        
        

class RegisterView(PutView):
    http_method_names = ['post',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    






