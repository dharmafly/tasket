# -*- coding: utf-8 -*-
import sys
sys.path.append('../server')
from global_settings import *



# Epio hack – local_settings.py wont exist on epio
try:
    from local_settings import *
except ImportError:
    pass

DEBUG = False
TEMPLATE_DEBUG = True
