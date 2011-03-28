# Installation

    cd tasket
    virtualenv --no-site-packages .
    source bin/activate
    easy_install pip
    pip install -r requirements.txt
    cd web
    cp local_settings.py.example local_settings.py

Edit _local_settings.py_ for the correct database settings - e.g. sqlite3

    'ENGINE': 'django.db.backends.sqlite3'

Set up the database:

    python manage.py syncdb
    python manage.py loaddata ../server/tasks/fixtures/test_data.json

    
# Run the server

If not done yet this session:

    source bin/activate
    cd web
    
Start the server:
    
    python manage.py runserver

Go to [http://localhost:8000](http://localhost:8000) to see the running app.
