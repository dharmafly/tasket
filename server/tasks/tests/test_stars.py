from django.test import TestCase
from django.conf import settings

from tasks.models import *

class StarredTests(TestCase):
    fixtures = ['test_data.json',]
    
    
    def test_star_unicode(self):
        self.assertEqual(unicode(Star.objects.all()[0]), 'task-3-TestUser')
        
    def test_star_queryset(self):
        stars = len(json.loads(Star.objects.all().as_json()))
        self.assertEqual(stars, 4)
    
    def test_task_stars(self):
        task = Task.objects.get(pk=3)
        self.assertEqual(task.starred().count(), 1)
    
    def test_task_get_single_with_star(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.get('/tasks/3')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)
    
    def test_hub_get_single_with_star(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.get('/hubs/3')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)
    
    def test_profile_get_single_with_star(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.get('/users/3')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)

    def test_star_task(self):
        self.client.login(username='TestUser', password='12345')
        
        response = self.client.get('/tasks/2')
        json_data = json.loads(response.content)
        self.assertFalse('starred' in json_data)
        
        response = self.client.put(
                '/tasks/2',
                data=json.dumps({"starred" : True}),
                content_type='application/json',
            )
        response = self.client.get('/tasks/2')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)
    
    def test_delete_star(self):
        self.client.login(username='TestUser', password='12345')
        
        response = self.client.get('/tasks/2')
        json_data = json.loads(response.content)
        self.assertFalse('starred' in json_data)
        
        response = self.client.put(
                '/tasks/2',
                data=json.dumps({"starred" : True}),
                content_type='application/json',
            )
        response = self.client.get('/tasks/2')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)
    
        response = self.client.put(
                '/tasks/2',
                data=json.dumps({"starred" : False}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertFalse('starred' in json_data)
    
    def test_star_new_task(self):
        self.client.login(username='TestUser', password='12345')
        hub = Hub.objects.get(pk=2)
        
        response = self.client.post(
                '/tasks/',
                data=json.dumps({
                    "starred" : True,
                    "estimate" : 60*10,
                    "hub" : hub.pk,
                    }),
                content_type='application/json',
            )
        self.assertEqual(response.status_code, 500)

    def test_profile_star(self):
        response = self.client.get('/users/2')
        json_data = json.loads(response.content)
        self.assertTrue('starred' in json_data)
        
