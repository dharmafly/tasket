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

# Building a single minified JavaScript file

## Build software installation

We use [smoosh][#smoosh] to package the JavaScript for production. To get it you
need [Node][#node] >= 4.0.1 and [npm][#npm] installed.

For hints on installation, see 
[joyeur.com/2010/12/10/installing-node-and-npm/](http://joyeur.com/2010/12/10/installing-node-and-npm/)). 
In particular, you may need to add NPM to your system paths, and also to Node's paths. 
Add to your Bash (or similar) config file:

    # Make NPM packages available to the terminal - type `npm bin` to get your system's path
    export PATH=$HOME/node_modules/.bin:$PATH
    
    # Make NPM packages available to Node
    export NODE_PATH="/usr/local/lib/node_modules"

Then install Smoosh:

    $ npm install smoosh

You may need to make the Smoosh program executable (you may need to prefix this command with `sudo `:

    chmod +x ~/node_modules/.bin/smoosh
    

# Building the JavaScript file
    
To package the JavaScript, `cd` into the _client/media/js/build/_ directory and either run:

    $ smoosh -c ./config.json
    
or:

    $ node make.js

This will run [JSHint](http://jshint.com) against the codebase and write _tasket.js_ and
_tasket.min.js_ in to the _client/media/js/build/pkg/_ directory.

NOTE: Ignore any JSHint warnings for header.js and footer.js these are invalid
JavaScript files used to wrap the Tasket application in a closure.

[#smoosh]: http://github.com/fat/smoosh/
[#node]: http://nodejs.org/
[#npm]: http://npmjs.org/
