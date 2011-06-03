# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile

from django.contrib.auth.models import User

from tasks.models import Hub, Task, Profile, Star
import tasks

class ModelTest(TestCase):
    
    fixtures = ['test_data.json',]
    
    def setUp(self):
        """
        Create a test user
        """

        self.U = User.objects.get(username='TestUser')
        self.P = Profile.objects.get(user=self.U)
        
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
                                ea commodo <b>consequat</b>. Duis aute irure dolor in 
                                reprehenderit in voluptate velit esse cillum 
                                dolore eu fugiat nulla pariatur. Excepteur sint 
                                occaecat cupidatat non proident, sunt in culpa 
                                qui officia deserunt mollit anim id est laborum.
                            """,
                owner=self.P,
                
            )
        H.save()
        H.image.save('Puppy', ContentFile(img.read()))
        
        self.H = H
        
        # TODO: add more fields
        self.T = Task(description="Example Task", hub=H, owner=self.P, estimate=60*10)
        self.T.save()
    
    def test_hub_unicode(self):
        self.assertEqual(unicode(self.H), "Test Hub")
    
    def test_hub_all_hubs(self):
        """
        Make sure there is exactly one hub.  Mainly to make sure fixtures are 
        working properly.
        """
        
        self.assertEqual(len(Hub.objects.all()), 3)
    
    def test_hub_as_json(self):
        json_data = json.loads(self.H.as_json())
        self.assertTrue('tasks' in json_data)
        self.assertEqual(json_data['title'], 'Test Hub')

    def test_profile_as_json(self):
        json_data = json.loads(self.P.as_json())
        self.assertTrue('estimates' in json_data)
        self.assertTrue('tasks' in json_data)
        self.assertEqual(json_data['username'], 'TestUser')

    def test_profile_starred(self):
        self.assertEqual(self.P.starred().count(), 1)

    def test_profile_starred_for_user(self):
        self.assertTrue(self.P.starred(user=self.U))
    
    def test_hub_queryset_as_json(self):
        obs = Hub.objects.all().as_json()
        obj = json.loads(obs)[0]
        self.assertEqual(obj['title'], 'Test Hub')

    def test_verified(self):
        H = Hub.unverified.all()
        self.assertEqual(len(H), 1)


    def test_timestamp_field(self):
        T = Task(claimedTime=123456789, owner_id=2, hub_id=2, description="asd")
        T.save()
        self.assertEqual(T.as_dict()['claimedTime'], 123456789)

    def test_user_create_signal(self):
        profiles_before = Profile.objects.all().count()
        u = User(username='test')
        u.save()
        profiles_after = Profile.objects.all().count()
        self.assertEqual(profiles_before+1, profiles_after)




