# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse

from django.contrib.auth.models import User

class ViewTests(TestCase):
    fixtures = ['test_data.json',]

    def test_charset_header(self):
        response = self.client.post("/login/", 
            json.dumps({
                'username' : 'TestUser',
                'password' : '12345',
            }), 
            content_type = "application/json; charset: UTF-8"
            )
        self.assertEqual(response.status_code, 200)

    def test_logged_in(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.get('/login/')
        self.assertEqual(json.loads(response.content)['user'], 2)

    def test_now_logged_in(self):
        response = self.client.get('/login/')
        self.assertTrue(response.context['form'])
    
    def test_logout(self):
        response = self.client.post('/logout/')
        self.assertEqual(response.status_code, 302)
        
    
    def test_log_in(self):
        response = self.client.post(
            '/login/',
            json.dumps({
                'username' : 'TestUser',
                'password' : '12345',
            }), 
            content_type = "application/json"
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['user']['id'], '2')
        self.assertEqual(json_data.keys(), ['sessionid', 'user',])
        self.assertTrue('email' in json_data['user'])

    def test_log_in_fail(self):
        response = self.client.post(
            '/login/',
            {
                'username' : 'TestUserFAIL',
                'password' : '12345',
            },
            content_type = "application/json"
            )
        self.assertEqual(json.loads(response.content)['status'], 401)
        self.assertEqual(json.loads(response.content).keys(), ['status', 'error'])

    def test_register(self):
        response = self.client.post(
            '/users/', json.dumps({
                'username' : 'newuser',
                'password' : '12345',
                'email' : 'newuser@example.com'
            }), 
            content_type='application/json',
            )
        self.assertEqual(response.status_code, 200)
        logged_in = self.client.login(username='newuser', password='12345')
        self.assertEqual(logged_in, True)
        self.assertEqual(json.loads(response.content)['id'], 6)

    def test_register_bad_email(self):
        response = self.client.post(
            '/users/', json.dumps({
                'username' : 'newuser',
                'password' : '12345',
                'email' : 'newuserexample.com'
            }), 
            content_type='application/json',
            )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(json.loads(response.content)['error'], "invalid email")


