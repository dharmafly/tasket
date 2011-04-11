# -*- coding: utf-8 -*-
import json
import mimetypes

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.validators import email_re
from django.conf import settings
from django.contrib.auth import forms as userforms

from utils.decorators import json_login_required as login_required


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
    def get(self, request, hub_id=None, tasks=None, image=None):

        if hub_id and not tasks:
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
    def post(self, request, hub_id=None, image=None):
        """
        Create a hub
        """
        
        if image:
            return self.image_upload(request, hub_id)

        res = HttpResponse()
        
        form = forms.HubForm(request.JSON)
        if form.is_valid():
            H = form.save(commit=False)
            H.owner = request.user.profile
            H.save()
        
            response_json =  {
                "id": str(H.pk), 
                "createdTime": H.created_timestamp()
                }
            self.res.write(json.dumps(response_json))
            
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
    
    def image_upload(self, request, hub_id):
        res = HttpResponse()

        # Handle image upload
        hub = get_object_or_404(Hub, pk=hub_id)
        
        for k,v in hub.as_dict().items():
            if k not in request.POST:
                request.POST[k] = v

        form = forms.HubForm(request.POST, request.FILES, instance=hub)
        if form.is_valid():
            H = form.save()
            res.write(json.dumps({'image' : H.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res

    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        form = forms.HubForm(request.PUT, instance=hub)
        if form.is_valid():
            H = form.save()
            response_json =  {
                "id": str(H.pk),
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
                "hub_id" : str(hub_id),
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
        
        if 'state' in request.GET:
            tasks = tasks.filter(state=request.GET['state'])
        
        self.res.write(tasks.as_json())
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request, task_id=None, image=None):
        
        if image:
            return self.image_upload(request, task_id)
        
        request.JSON['state'] = request.JSON.get('state', Task.STATE_NEW)
        form = forms.TaskForm(request.JSON, request=request)
        if form.is_valid():
            T = form.save(commit=False)
            T.owner = request.user.profile
            T.save()
            self.res.write(T.as_json())
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = form.status_code
        return self.res
    
    def image_upload(self, request, task_id):
        res = HttpResponse()

        # Handle image upload
        task = get_object_or_404(Task, pk=task_id)
        
        request.POST['state'] = task.state
        request.POST['hub'] = task.hub_id
        
        form = forms.TaskForm(request.POST, request.FILES, instance=task, request=request)
        if form.is_valid():
            T = form.save()
            res.write(json.dumps({'image' : T.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res
    
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        request.PUT['hub'] = task.hub.pk
        request.PUT['state'] = request.PUT.get('state', Task.STATE_NEW)
        form = forms.TaskForm(request.PUT, instance=task, request=request)
        if form.is_valid():
            T = form.save()
            self.res.write(T.as_json())
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = form.status_code
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
                "task_id" : str(task_id),
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
    def post(self, request, user_id=None, image=None):
        if image:
            return self.image_upload(request, user_id)
        
        request.POST = request.JSON
        username = request.JSON.get('username')
        password = request.JSON.get('password')
        email = request.JSON.get('email')
        
        form = userforms.UserCreationForm(
                {
                    'username': username,
                    'email' : email,
                    'password1' : password,
                    'password2' : password
                }
                )
        if not form.is_valid():
            error_dict = dict(form.errors.items())
            self.res.write(json.dumps(error_dict))
            self.res.status_code = 500
            return self.res

            
        form.save()

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
                        'id' : user.pk
                    }
                )
            )
        return self.res

    def image_upload(self, request, user_id):
        res = HttpResponse()
        if int(user_id) != request.user.pk:
            res.write(json.dumps(
                {
                'error' : "Unauthorized",
                'status' : 401
                }
            ))
            res.status_code = 401
            return res
        
        # Handle image upload
        profile = request.user.profile
        
        for k,v in profile.as_dict().items():
            if k not in request.POST:
                request.POST[k] = v
        
        form = forms.ProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            P = form.save()
            res.write(json.dumps({'image' : P.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res


def thumbs(request, size, path):
    try:
        im_obj = open("%s%s" % (settings.MEDIA_ROOT, path))
    except Exception, e:
        raise Http404(json.dumps({'error' : 'image not found'}))

    crop = None
    if 'crop' in request.GET:
        crop = 'center'
    im = get_thumbnail(im_obj, size, quality=99, crop=crop)
    
    file_mimetype = mimetypes.guess_type(im_obj.name)
    return HttpResponse(im.read(), mimetype=file_mimetype)


def statistics(request):
    """
    Stats on objects in the database.
    
    Something like:
    
    { 
        'new': 23, # Total tasks with "new" status
        'claimed': 123, # Total tasks with "claimed" status etc.
        'done': 23,
        'verified': 345,
    }
    """

    stats = {
        'tasks' : {
            'new' : str(Task.objects.filter(state=Task.STATE_NEW).count()),
            'claimed' : str(Task.objects.filter(state=Task.STATE_CLAIMED).count()),
            'done' : str(Task.objects.filter(state=Task.STATE_DONE).count()),
            'verified' : str(Task.objects.filter(state=Task.STATE_VERIFIED).count()),
        }
    }
    





    return HttpResponse(json.dumps(stats))