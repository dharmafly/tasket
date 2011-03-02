# -*- coding: utf-8 -*-
import json

from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm

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
        
        if request.user.is_authenticated():
            self.res.write(json.dumps(
                {
                    'logged_in' : True,
                    'user': request.user.profile.pk
                }
                ))
            return self.res
        
        form = AuthenticationForm(request, data=request.POST)
        return render_to_response(
            'login.html',
            {
                'form' : form,
            },
            context_instance=RequestContext(request)
            )

    def post(self, request):
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = request.POST['username']
            password = request.POST['password']
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return HttpResponseRedirect('/login/')
                else:
                    self.res.write(json.dumps(
                        {
                            'logged_in' : False,
                            'error': "Account disabled",
                        }
                        ))
                    self.res.status_code = 403
                    return self.res
            else:
                # Return an 'invalid login' error message.
                pass
        else:
            return render_to_response(
                'login.html',
                {
                    'form' : form,
                },
                context_instance=RequestContext(request)
                )
    