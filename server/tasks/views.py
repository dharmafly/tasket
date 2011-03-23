# -*- coding: utf-8 -*-
import json
import mimetypes

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

from utils.decorators import json_login_required as login_required
from django.conf import settings

from sorl.thumbnail import get_thumbnail
from utils.helpers import AllowJSONPCallback, PutView

from models import Hub, Task, Profile
import forms


def home(reqeust):
    f = open("%s/client/index.html" % settings.ROOT_PATH, "r")
    return HttpResponse(f.read())


class HubView(PutView):
    
    http_method_names = ['get', 'post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    @method_decorator(AllowJSONPCallback)
    def get_hub_tasks(self, request, hub_id, tasks=None):
        hub = get_object_or_404(Hub, pk=hub_id)
        self.res.write(hub.task_set.all().as_json())
        return self.res
        
    def get_single(self, reqeust, hub_id=None, tasks=None):
        hub = get_object_or_404(Hub, pk=hub_id)        
        self.res.write(hub.as_json())
        return self.res
    
    
    @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id=None, tasks=None):
        if hub_id:
            return self.get_single(request, hub_id)
        if hub_id and tasks:
            return self.get_hub_tasks(request, hub_id, tasks)
        
        hubs = Hub.objects.all()
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            hubs = hubs.filter(pk__in=ids)
        
        res = self.res
        res.write(hubs.as_json())
        return res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request):
        """
        Create a hub
        """
        res = HttpResponse()
        
        form = forms.HubForm(request.JSON)
        if form.is_valid():
            H = form.save(commit=False)
            H.owner = request.user.profile
            H.save()
        
            response_json =  {
                "id": H.pk, 
                "createdTime": H.created_timestamp()
                }
            self.res.write(json.dumps(response_json))
            
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        form = forms.HubForm(request.PUT, instance=hub)
        if form.is_valid():
            H = form.save()
            response_json =  {
                "id": H.pk,
                "updated" : True,
                "hub" : H.as_dict()
                }
            self.res.write(json.dumps(response_json))
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def delete(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        hub_id = hub.pk
        hub.delete()
        self.res.write(json.dumps(
            {
                "deleted" : True,
                "hub_id" : hub_id,
            }
            ))
        return self.res


class TasksView(PutView):
    http_method_names = ['get','post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    def get_single(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        self.res.write(task.as_json())
        return self.res
        
    @method_decorator(AllowJSONPCallback)
    def get(self, request, task_id=None):
        if task_id:
            return self.get_single(request, task_id)
        
        tasks = Task.objects.all()
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            tasks = tasks.filter(pk__in=ids)
            
        self.res.write(tasks.as_json())
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request, task_id=None):
        request.JSON['state'] = request.JSON.get('state', 0)
        form = forms.TaskForm(request.JSON, request=request)
        if form.is_valid():
            T = form.save(commit=False)
            T.owner = request.user.profile
            T.save()
            self.res.write(T.as_json())
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
            
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        request.PUT['hub'] = task.hub.pk
        request.PUT['state'] = request.PUT.get('state', 0)
        form = forms.TaskForm(request.PUT, instance=task, request=request)
        if form.is_valid():
            T = form.save()
            self.res.write(T.as_json())
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def delete(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        task_id = task.pk
        task.delete()
        self.res.write(json.dumps(
            {
                "deleted" : True,
                "task_id" : task_id,
            }
            ))
        return self.res


class ProfileView(PutView):
    http_method_names = ['get','post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    def get_single(self, request, user_id):
        profile = get_object_or_404(Profile, user=user_id)
        self.res.write(profile.as_json())
        return self.res
        
    @method_decorator(AllowJSONPCallback)
    def get(self, request, user_id=None):
        if user_id:
            return self.get_single(request, user_id)
        
        users = Profile.objects.all()
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            users = users.filter(user__in=ids)
            
        self.res.write(users.as_json())
        return self.res

    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, user_id=None):
        profile = get_object_or_404(Profile, user=user_id)
        form = forms.ProfileForm(request.PUT, instance=profile)

        if form.is_valid():
            T = form.save(commit=False)
            T.user = profile.user
            T.save()
            self.res.write(T.as_json())
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res

        def invalid(self, *args):
            self.res.write(json.dumps({
                'errors' : args, 
            }))
            return self.res

    @method_decorator(AllowJSONPCallback)
    def post(self, request):
        request.POST = request.JSON
        username = request.JSON.get('username')
        password = request.JSON.get('password')
        email = request.JSON.get('email')
        
        user = User.objects.create_user(username=username,
                email=email,
                password=password)
        user.save()

        user = authenticate(username=username, password=password)

        form = forms.ProfileForm(request.JSON)
        T = form.save(commit=False)
        T.user = user
        T.save()

        
        user = authenticate(username=username, password=password)
        login(request, user)

        self.res.write(
            json.dumps(
                    {
                        'user_id' : user.pk
                    }
                )
            )
        return self.res





def thumbs(request, size, path):
        
    im_obj = open("%s/%s" % (settings.MEDIA_ROOT, path))

    crop = None
    if 'crop' in request.GET:
        crop = 'center'
    im = get_thumbnail(im_obj, size, quality=99, crop=crop)
    
    file_mimetype = mimetypes.guess_type(im_obj.name)
    return HttpResponse(im.read(), mimetype=file_mimetype)






