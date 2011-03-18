# Installation

    cd tasket
    virtualenv --no-site-packages .
    source bin/activate
    easy_install pip
    pip install -r requirements.txt
    cd web
    cp local_setting.py.example local_settings.py

Edit _local_settings.py_ for the correct database settings - e.g. sqlite3

    'ENGINE': 'django.db.backends.sqlite3'

Then set up the database:

    python manage.py syncdb
    python manage.py loaddata ../server/tasks/fixtures/test_data.json
    python manage.py runserver

Go to http://localhost:8000 and it should work.

