# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile

from django.contrib.auth.models import User

from tasks.models import Hub, Task
import tasks


class ViewTests(TestCase):
    fixtures = ['test_data.json',]

    def test_hubs_get(self):
        response = self.client.get('/hubs/')
        json_list = json.loads(response.content)
        self.assertEqual(json_list[0]['title'], "Example Hub 2")
    
    def test_hubs_get_by_id(self):
        response = self.client.get('/hubs/?ids=2')
        json_list = json.loads(response.content)
        self.assertEqual(json_list[0]['title'], "Example Hub")
    
    def test_hubs_get_by_id_nonexistent(self):
        response = self.client.get('/hubs/?ids=10')
        json_list = json.loads(response.content)
        self.assertEqual(len(json_list), 0)
    
    def test_hubs_post_loggedin(self):
        self.client.login(username='TestUser', password='12345')
    
        response = self.client.post(
            '/hubs/', 
            json.dumps({
                'title' : 'New Hub',
            }),
            content_type="application/json",
            )
        json_list = json.loads(response.content)
    
        self.assertEqual(set(json_list.keys()), set(['id', 'createdTime']))
    
    def test_hubs_post_loggedin_error(self):
        self.client.login(username='TestUser', password='12345')
    
        response = self.client.post(
            '/hubs/', 
            json.dumps({
                'wrong' : 'New Hub',
            }),
            content_type="application/json",
            )
        self.assertEqual(response.status_code, 500)
    
    def test_hubs_post_not_loggedin(self):
    
        response = self.client.post(
            '/hubs/', 
            json.dumps({
                'title' : 'New Hub',
            }),
            content_type="application/json",
            )
    
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.content)['error'], 'Forbidden')
    
    
    def test_hub_get(self):
        response = self.client.get('/hubs/2')
        json_data = json.loads(response.content)
        self.assertEqual(json_data['title'], 'Example Hub')
        self.assertEqual(json_data['owner'], '2')
    
    def test_hub_get_nonexistent(self):
        response = self.client.get('/hubs/100')
        self.assertEqual(response.status_code, 404)
    
    def test_hub_put(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.put(
                '/hubs/2', 
                data=json.dumps({'title' : 'Updated Title',}),
                content_type='application/json',
            )
        self.assertEqual(json.loads(response.content)['updated'], True)
    
    def test_hub_delete(self):
        self.client.login(username='TestUser', password='12345')
        hubs = Hub.objects.all()
        response = self.client.delete('/hubs/2')
        hubs = Hub.objects.all()
        self.assertEqual(len(hubs), 1)
    
    def test_hub_task_list(self):
        response = self.client.get('/hubs/2/tasks/')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 7)
    
    def test_task_get(self):
        response = self.client.get('/tasks/')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 4)
    
    def test_task_get_single(self):
        response = self.client.get('/tasks/3')
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("This is"), True)
    
    def test_task_get_by_id(self):
        response = self.client.get('/tasks/?ids=4,5')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 2)
    
    def test_task_create(self):
        self.client.login(username='TestUser', password='12345')
        hub = Hub.objects.get(pk=2)
        response = self.client.post(
            '/tasks/',
            json.dumps({
                "description" : "Lorem ipsum dolor sit amet, consectetur",
                "estimate" : 60*10,
                "hub" : hub.pk,
            }),
            content_type='application/json',
            )

        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("Lorem"), True)

    def test_task_put(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.put(
                '/tasks/3',
                data=json.dumps({"description" : "New description!"}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("New"), True)
    
    
    def test_hub_delete(self):
        self.client.login(username='TestUser', password='12345')
        old_tasks = len(Task.objects.all())
        response = self.client.delete('/tasks/3')
        tasks = len(Task.objects.all())
        self.assertEqual(old_tasks-1, tasks)

    def test_user_get(self):
        response = self.client.get('/users/')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 4)

    def test_user_get_single(self):
        response = self.client.get('/users/2')
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("This is"), True)

    def test_user_get_by_id(self):
        response = self.client.get('/users/?ids=2,3')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 2)

    
    def test_user_put(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.put(
                '/users/3',
                data=json.dumps({"description" : "New <b>description!</b>"}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("New"), True)

    def test_user_delete(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.delete('/users/3')

        self.assertEqual(response.status_code, 405)
