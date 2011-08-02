# Tasket API #

Note: in future, arrays may be further filtered by ?page=n&per_page=m - e.g. /hubs/3/tasks?page=2&per_page=10


## Hubs ##

    /hubs/                  # GET:   Gets all active hubs (ie. unarchived hubs that have unverified tasks remaining)
    /hubs/?ids=ids          # GET:   Gets array of hubs matching :ids (comma-delimited list of ids)
    /hubs/?archived=:state  # GET:   Gets hubs based on their archived state
                                         (possible states: "true", "false", "all")
    /hubs/                  # POST:  Creates a hub (responds with new id & createdTime eg.
                                         {"id": "hub_id", "createdTime": 1298567873})
    /hubs/:id               # GET:   Gets a single hub for :id
    /hubs/:id               # PUT:   Updates a single hub for :id
    /hubs/:id               # DELETE Deletes a single hub for :id
    /hubs/:id/tasks         # GET    Gets array of all unverified tasks for this hub
    /hubs/:id/image         # POST   Uploads an image to the hub with :id (requires multipart/form-data)

### Hub Model Data ###

    {
        "id": "HUB_ID",           *required (assigned by server on creation)
        "title": "TITLE",         *required
        "owner": "USER_ID",       *required
        "description": "",
        "image": "",
        "tasks": {
            "new":      [/* ids of tasks */],
            "claimed":  [/* ids of tasks */],
            "done":     [/* ids of tasks */],
            "verified": [/* ids of tasks */]
        },
        "estimates": {
            "new":      232, // total estimated time for all new tasks, in seconds
            "claimed":  2224,
            "done":     44554,
            "verified": 4534
        },
        "createdTime": 1298567873
    }

## Tasks ##

    /tasks/                  # GET:   Gets all unverified tasks
    /tasks/?ids=:ids         # GET:   Gets array of tasks matching :ids (comma-delimited list of ids)
    /tasks/?state=:state     # GET:   Gets array of tasks that are in the state :state, or a comma-delimited list of states
                                          (possible states: "new", "claimed", "done", "verified")
    /tasks/                  # POST:  Creates a task (responds with new id eg. {"id": "task_id"})
    /tasks/:id               # GET:   Gets a single task for :id
    /tasks/:id               # PUT:   Updates a single task for :id
    /tasks/:id               # DELETE Deletes a single task for :id
    /tasks/:id/image         # POST   Uploads an image to the task with :id (requires multipart/form-data)

### Task Model Data ###

    {
        "id": "TASK_ID",          *required (assigned by server on creation)
        "hub": "HUB_ID"           *required
        "owner": "USER_ID",       *required
        "estimate": ESTIMATE_TIME,*required
        "description": "",
        "image": "",
        "state": "new",
        "archived": true,
        "createdTime": 1298567873
        "claimedBy": "user_id",
        "claimedTime": 1231214214,
        "doneTime": 1231214214,
        "verifiedBy": "user_id",
        "verifiedTime": 1231214214
    }

### Task State Constants ###

    NEW     : "new",  
    CLAIMED : "claimed",  
    DONE    : "done",  
    VERIFIED: "verified"  

## Users ##

     /users/               # GET:   Gets array of all users
     /users/?ids=:ids      # GET:   Gets array of users matching :ids (comma delimited list of ids)
     /users/               # POST:  Creates a user (responds with new id eg. {"id": "user_id"})
     /users/:id            # GET:   Gets a single user for :id
     /users/:id            # PUT:   Updates a single user for :id
     /users/:id            # DELETE Deletes a single user for :id
     /users/:id/image      # POST   Uploads an image to the user with :id (requires multipart/form-data)

### User registration ###

POSTing to /users/ with the following JSON object will create a user and log 
them in.  The newly created profile object ID will be returned:

    {
        'username': 'test99', 
        'email': 'foo@example.com', 
        'password': '12345', 
        'description': 'New description!', 
        'name': 'Test User 99'
    }


### User Model Data ###

    {
        "id": "USER_ID",      *required (assigned by server on creation)
        "name": "DISPLAY_NAME", *required
        "description": "",
        "location": "",
        "image": "",
        "admin": false,
        "hubs": {
            "owned": [/* active hubs created by this user   */],
            "archived": [/* archived hubs created by this user */]
        },
        "tasks": {
            "owned": {
                "new":      [/* tasks owned by this user that have not been claimed */]
                "claimed":  [/* tasks owned by this user that have been claimed but not done */],
                "done":     [/* tasks owned by this user that have been done but not verified */],
                "verified": [/* tasks owned by this user that have been verified */],
                "archived": [/* archived tasks owned by this user */]
            },
            "claimed": {
                "claimed":  [/* tasks claimed by this user that have not yet been done */],
                "done":     [/* tasks claimed by this user that have been done but not verified */],
                "verified": [/* tasks claimed by this user that have been verified */],
                "archived": [/* archived tasks claimed by this user */]
            }
        },
        "estimates": {
            "owned": {
                "new":      232, // total estimated time for all new tasks owned by this user, in seconds
                "claimed":  232, // total estimated time for all claimed tasks owned by this user, in seconds
                "done":     232, // total estimated time for all done tasks owned by this user, in seconds
                "verified": 232  // total estimated time for all verified tasks owned by this user, in seconds
            },
            "claimed": {
                "claimed":  232, // total estimated time for all tasks claimed by this user that are not yet done, in seconds
                "done":     232, // total estimated time for all tasks claimed by this user that are done but not verified, in seconds
                "verified": 232  // total estimated time for all tasks claimed by this user that have been verified, in seconds
            }
        },
        "createdTime": 1298567873
    }


## Images ##

[image path] here is the value of the 'image' attribute on the models above.

    /media/[image path]           #GET original uploaded image
    /thumb/NxN/[image path]       #GET thumbnail constrained to N
    /thumb/NxN/[image path]?crop  #GET thumbnail constrained to N and cropped form the centre
    
    
## Statistics ##

    /statistics/     #GET hash of relevant global statistics

### Statistics data ###
    {
        "hubs": {
            "archived": 3  // Total archived hubs
        }, 
        "tasks": {
            "archived": 12 // Total archived tasks
            "new": 23      // Total tasks with "new" status
            "claimed": 123 // Total tasks with "claimed" status etc.
            "done": 23
            "verified": 345
        }
    }


## Settings ##

    /settings/      #GET JSON object containing key/value pairs of settings, as 
                     white listed in settings.EXPOSED_SETTINGS

## Stars ##

Any object (users, hubs, tasks) can be 'starred'.  Objects a user has starred 
are contained in the `stars` object on the user model, broken down by object 
type, for example:

    "stars" : {"hubs": ["3"], "tasks": ["3", "2"], "users": ["2", "3"]}

When an object has been starred by a user, it will have a `starred` property, 
containing an object, for example:

    "starred": {"timestamp": 1307117640, "type": "profile", "id": 2}

If an object has no stars, the `starred` property won't exist.

To star any object, `POST` to it with `{"starred" : true}`.  To un-star an object,
`POST` `{"starred" : false}` to it.

NOTE: only objects that exist in the database can be starred, so in order to star 
a new object it must be saved first.  In other words, it is not possible to star
in a POST request.


## Archiving ##

Hubs can be archived and restored.  By default only active (non-archived) hubs 
are returned and displayed.  

When a hub has been archived, it will have an `archived` property, containing 
an object. This archived property on a hub contains the server timestamp of 
when the hub was archived, and the id of the user who archived it:

    "archived": { timestamp: 1312278392, archivedBy: "6" }
    
If a hub hasn't been archived, this property won't exist.

The `archived` flag is global - it applies to the hub for all users, rather 
than being a personal setting different for each user.

Tasks may not be individually archived. An "archived" task is a task that 
belongs to an archived hub.

To archive a hub, `POST` to it with `{"archived" : true}`.  To restore a hub,
unset any archived parameters and `POST` `{"archived" : false}` to it.