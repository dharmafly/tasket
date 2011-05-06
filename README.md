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


# On Linux, ensure the image library paths are correct

If you find that images in the app are not successfully processed after upload (with a 500 Server Error for each image request), there may be a problem where the [Python Image Library (PIL)](http://effbot.org/zone/pil-index.htm) cannot find the correct path to JPEG and other image libraries. To resolve it, [follow the steps in this article](http://www.eddiewelker.com/2010/03/31/installing-pil-virtualenv-ubuntu/).

For further info, [see this article](http://effbot.org/zone/pil-decoder-jpeg-not-available.htm)) and [Issue #110](https://github.com/premasagar/tasket/issues/110).


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

# Cron

It's recommended to run the `task_states` management command every so often.

This does 2 things:

1. If a task has been claimed but not done within `settings.CLAIMED_TIME_LIMIT` 
    (default 24 hours) then the task state is reverted to 'new'
2. If a task has been done but not verified then it is automatically verified 
    after `settings.DONE_TIME_LIMIT` (default 24 hours)

To run this command at 10 minutes pass every hour, add the following to your crontab:

> 10 * * * * python [path/to/]web/manage.py task_states

NOTE: If you are using virtualenv, make sure you activate it before running the command.


# Admin users

There are two types of admins:

1. 'task admins' – users that can perform various admin operations using the 
    front end (such as editing any task and hub).
2. 'super users' – users that can log in to the django backend and edit other 
    users (to make them a 'task admin', for example).

Only 'super users' can login to the django admin.  A super user should have been 
created  when the site was installed.  If no super user exists, running the 
following will create a one: 

> python manage.py createsuperuser

To login to django as a superuser, go to `/admin/` in a browser.

## Making a normal user in to a task admin

After logging in to django, go to `/admin/tasks/profile/` and click on the user
you want to edit.

Click the `Admin` checkbox and save the user.

## Making a normal user a super user

Log in to django and go to `/admin/auth/user/`.  Click on the user you want to 
edit and check both the 'super user' and 'staff' check boxes.  Save the user.
