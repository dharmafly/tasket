# -*- coding: utf-8 -*-
import json

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
# from django.core import serializers

from utils import AllowJSONPCallback, PutView

from models import Hub, Task
import forms

class HubView(PutView):
    
    http_method_names = ['get', 'post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    
    @method_decorator(AllowJSONPCallback)
    def get_single(self, reqeust, hub_id=None, tasks=None):
        hub = get_object_or_404(Hub, pk=hub_id)        
        self.res.write(hub.as_json())
        return self.res
    
    
    @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id=None, tasks=None):
        if hub_id:
            return self.get_single(request, hub_id)
        
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
    
        form = forms.HubForm(request.POST)
        if form.is_valid():
            H = form.save(commit=False)
            H.owner = request.user
            H.save()
        
            response_json =  {
                "id": H.pk, 
                "createdTime": H.created_timestamp()
                }
            self.res.write(json.dumps(response_json))

        else:
            required_list = ", ".join(form.errors.keys())
            self.res.write(json.dumps("%s are required" % required_list))
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
            required_list = ", ".join(form.errors.keys())
            self.res.write(json.dumps("%s are required" % required_list))
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
    

class HubTasks(PutView):
    http_method_names = ['get',]

    @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        self.res.write(hub.task_set.all().as_json())
        return self.res



class TasksView(PutView):
    http_method_names = ['get','post', 'put',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/javascript')
    
    
    @method_decorator(AllowJSONPCallback)
    def get_single(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        self.res.write(task.as_json())
        return self.res

    @method_decorator(AllowJSONPCallback)
    def get(self, request, task_id=None):
        if task_id:
            return self.get_single(request, task_id)
        
        tasks = Task.objects.filter(verifiedBy=None)
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            tasks = tasks.filter(pk__in=ids)

        self.res.write(tasks.as_json())
        return self.res

    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request, task_id=None):
        form = forms.TaskForm(request.POST)
        if form.is_valid():
            T = form.save(commit=False)
            T.owner = request.user
            T.save()
            self.res.write(T.as_json())
        else:
            required_list = ", ".join(form.errors.keys())
            self.res.write(json.dumps("%s are required" % required_list))
            self.res.status_code = 500
        return self.res
            
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        form = forms.TaskForm(request.PUT, instance=task)
        # form.hub = task.hub
        if form.is_valid():
            T = form.save()
            self.res.write(T.as_json())
        else:
            required_list = ", ".join(form.errors.keys())
            self.res.write(json.dumps("%s are required" % required_list))
            self.res.status_code = 500
        return self.res



