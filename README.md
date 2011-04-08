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

# Packaging JavaScript

We use [smoosh][#smoosh] to package the JavaScript for production. To get it you
need [Node][#node] >= 4.0.1 and [npm][#npm] installed. Then simply run:

    $ npm install smoosh

To package the JavaScript `cd` into the _client/media/js/build/_ directory and
run:

    $ smoosh ./config.json

This will run JSHint against the codebase and write _tasket.js_ and
_tasket.min.js_ in to the _client/media/js/build/pkg/_ directory.

NOTE: Ignore any JSHint warnings for header.js and footer.js these are invalid
JavaScript files used to wrap the Tasket application in a closure.

[#smoosh]: http://github.com/fat/smoosh/
[#node]: http://nodejs.org/
[#npm]: http://npmjs.org/
