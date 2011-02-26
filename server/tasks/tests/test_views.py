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

    def test_hubs_get_status(self):
        response = self.client.get('/hubs/')
        self.assertEqual(response.status_code, 200)
    
    def test_hubs_get(self):
        response = self.client.get('/hubs/')
        json_list = json.loads(response.content)
        self.assertEqual(json_list[0]['title'], "Example Hub")
    
    def test_hubs_get_by_id(self):
        response = self.client.get('/hubs/?id=1')
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
            {
                'title' : 'New Hub',
            }
            )
        json_list = json.loads(response.content)
    
        self.assertEqual(set(json_list.keys()), set(['id', 'createdTime']))
    
    def test_hubs_post_loggedin_error(self):
        self.client.login(username='TestUser', password='12345')
    
        response = self.client.post(
            '/hubs/', 
            {
                'wrong' : 'New Hub',
            }
            )
        self.assertEqual(response.status_code, 500)
    
    def test_hubs_post_not_loggedin(self):
    
        response = self.client.post(
            '/hubs/', 
            {
                'title' : 'New Hub',
            }
            )
    
        self.assertEqual(response.status_code, 302)
    
    
    def test_hub_get(self):
        response = self.client.get('/hubs/1/')
        json_data = json.loads(response.content)
        self.assertEqual(json_data['title'], 'Example Hub')
    
    def test_hub_get_nonexistent(self):
        response = self.client.get('/hubs/100/')
        self.assertEqual(response.status_code, 404)
    
    def test_hub_put(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.put(
                '/hubs/1/', 
                data=json.dumps({'title' : 'Updated Title',}),
                content_type='application/json',
            )
        self.assertEqual(json.loads(response.content)['updated'], True)
    
    def test_hub_delete(self):
        self.client.login(username='TestUser', password='12345')
        hubs = Hub.objects.all()
        response = self.client.delete('/hubs/1/')
        hubs = Hub.objects.all()
        self.assertEqual(len(hubs), 0)
    
    def test_hub_task_list(self):
        response = self.client.get('/hubs/1/tasks/')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 7)
    
    def test_task_get(self):
        response = self.client.get('/tasks/')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 1)
    
    def test_task_get_single(self):
        response = self.client.get('/tasks/2/')
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("This is"), True)
    
    def test_task_get_by_id(self):
        response = self.client.get('/tasks/?ids=4,5')
        json_data = json.loads(response.content)
        self.assertEqual(len(json_data), 0)
    
    def test_task_create(self):
        self.client.login(username='TestUser', password='12345')
        hub = Hub.objects.get(pk=1)
        response = self.client.post(
            '/tasks/',
            {
                "description" : "Lorem ipsum dolor sit amet, consectetur",
                "estimate" : 60*10,
                "hub" : hub.pk,
            }
            )
        
        json_data = json.loads(response.content)
        self.assertEqual(json_data['description'].startswith("Lorem"), True)

    def test_task_put(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.put(
                '/tasks/2/',
                data=json.dumps({"description" : "New description!"}),
                content_type='application/json',
            )
        # print repr(response.content)
        # print response.status_code
        json_data = json.loads(response.content)
        print json_data
        self.assertEqual(json_data['description'].startswith("New"), True)
    
    
    
    
    
