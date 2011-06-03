# -*- coding: utf-8 -*-
import sys
import os
sys.path.append('../server')
from global_settings import *



# Epio hack – local_settings.py wont exist on epio
try:
    from local_settings import *
except ImportError:
    pass

TEMPLATE_DEBUG = True

if os.environ.get('DJANGO_DEBUG') == "true":
    DEBUG = True
