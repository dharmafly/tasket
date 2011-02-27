# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile

from django.contrib.auth.models import User

from tasks.models import Hub, Task
import tasks

class ModelTest(TestCase):
    
    fixtures = ['test_data.json',]
    
    def setUp(self):
        """
        Create a test user
        """

        self.U = User.objects.get(username='TestUser')
        
        image_path = "%s/fixtures/Puppy.jpg" % tasks.__path__[0]
        img = open(image_path)

        H = Hub(
                title="Test Hub", 
                description="""
                                Lorem ipsum dolor sit amet, consectetur 
                                adipisicing elit, sed do eiusmod tempor 
                                incididunt ut labore et dolore magna aliqua. 
                                Ut enim ad minim veniam, quis nostrud 
                                exercitation ullamco laboris nisi ut aliquip ex 
                                ea commodo consequat. Duis aute irure dolor in 
                                reprehenderit in voluptate velit esse cillum 
                                dolore eu fugiat nulla pariatur. Excepteur sint 
                                occaecat cupidatat non proident, sunt in culpa 
                                qui officia deserunt mollit anim id est laborum.
                            """,
                owner=self.U,
                
            )
        H.save()
        # H.image.save('Puppy', ContentFile(img.read()))
        
        self.H = H
        
        # TODO: add more fields
        self.T = Task(description="Example Task", hub=H, owner=self.U)
        self.T.save()
    
    def test_hub_unicode(self):
        self.assertEqual(unicode(self.H), "Test Hub")
    
    def test_all_hubs(self):
        """
        Make sure there is exactly one hub.  Mainly to make sure fixtures are 
        working properly.
        """
        
        self.assertEqual(len(Hub.objects.all()), 3)
    
    def test_as_json(self):
        self.assertEqual(json.loads(self.H.as_json())['title'], 'Test Hub')
    
    def test_queryset_as_json(self):
        obs = Hub.objects.all().as_json()
        obj = json.loads(obs)[0]
        self.assertEqual(obj['title'], 'Test Hub')

    def test_verified(self):
        H = Hub.unverified.all()
        self.assertEqual(len(H), 2)







