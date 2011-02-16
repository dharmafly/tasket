/*global jQuery, console, _*/

/*
    TODO:
    Architectural issues to solve:
        * tempIds -> ids
            ** lookup object normalisation
            ** partial data, e.g. hub === number, with no owner
            ** changeId of an item, in all collections
        * async retrieval of info from server -> callbacks in methods
*/


var namespace = "tasket",
    appName = "Tasket",
    version = "0.1.0",
    
    //JSON = window.JSON,
    undef;

/////
    
function map(obj, fn){
    var result = [],
        prop, val;

    for (prop in obj){
        if (obj.hasOwnProperty(prop)){
            val = fn.call(obj, prop, obj[prop]);
            result.push(val);
        }
    }
    return result;
}

// TODO: execute this and respond if not supported
function browserIsSupported(){
    return !!window.JSON;
}

function now(){
    return (new Date()).getTime();
}

function isAlphaNum(arg){
    return typeof arg === "number" || typeof arg === "string";
}

function report(msg, type){
    return appName + (type ? " " + type : "") + ": " + msg;
}

function ids(collection){
    return arrayMap(collection, function(id){
        return id;
    });
}

function count(){
    if (!count._){
        count._ = 0;
    }
    return count._ ++;
}

function tempId(){
    return "t" + now() + "-" + count();
}


/////


// TASKET CONSTRUCTOR
function Tasket(namespace){
    if (!namespace){
        throw report("namespace required");
    }
    this.namespace = namespace;
}

// TASKET: STATIC PROPERTIES
Tasket.version = version;

// TASKET: INSTANCE PROTOTYPE
Tasket.prototype = {
    tasks: {},
    users: {},
    hubs: {},
    
    _fullOrStub: function(type, item, Full, Stub){
        var isStub;
        
        if (item instanceof Full || item instanceof Stub){
            return item;
        }
        if (item !== undef){
            isStub = isAlphaNum(item);
            return this[type]({id:item, stub:true});
        }
    },
    
    _item: function(item, Constructor, collection){
        var create = (Constructor !== false);

        if (isAlphaNum(item)){
            item = collection[item];
            
            return !create && item ?
                this._item(item, false, collection) : // Delete item
                item; // Return item (or undefined)
        }
        if (!item.id){
            throw report("id property required");
        }        
        if (create){
            item.tasket = this;
            item = new Constructor(item);
            collection[item.id] = item;
        }
        else {
            delete collection[item.id];
        }
        return item;
    },
    
    // get/set task
    task: function(item, create){
        var Constructor = (create !== false) ?
                (item.stub ? TaskStub : Task) : false,
            task = this._item(item, Constructor, this.tasks),
            hubTasks;
        
        // Add/remove task to hub's collection
        if (task && !task.stub){
            hubTasks = task.hub && task.hub.tasks;
            
            if (create){
                hubTasks[task.id] = task;
            }
            else if (hubTasks) {
                delete hubTasks[task.id];
            }
        }
        return task;
    },
    
    // get/set hub
    hub: function(item, create){
        var Constructor = (create !== false) ?
                (item.stub ? HubStub : Hub) : false;
            
        return this._item(item, Constructor, this.hubs);
    },
    
    // get/set user
    user: function(item, create){
        var Constructor = (create !== false) ?
                (item.stub ? UserStub : User) : false;
            
        return this._item(item, Constructor, this.users);
    },
    
    // Publish an event
    pub: function(type, item, data){
        console.log(type, data);
    },
    
    // Subscribe to an event
    sub: function(type, callback){
    },
    
    import: function(data){
        /*
            {users:[], hubs:[], tasks:[]}
        */

        var i, len, hub, task;
        
        if (data.users){
            i = 0;
            len = data.users.length;
            for (i=0; i<len; i++){
                this.user(data.users[i]);
            }
        }
        
        if (data.hubs){
            i = 0;
            len = data.hubs.length;
            for (i=0; i<len; i++){
                hub = data.hubs[i];
                hub.owner = this.user(hub.owner);
                this.hub(hub);
            }
        }
        
        if (data.tasks){
            i = 0;
            len = data.tasks.length;
            for (i=0; i<len; i++){
                task = data.tasks[i];
                task.owner = this.user(task.owner);
                task.hub = this.hub(task.hub);
                this.task(task);
            }
        }
        
        return this;
    },
    
    export: function(stringify){
        var result = {
            namespace: this.namespace,
            version: Tasket.version,
            users: map(this.users, function(id, item){
                return item.export(false);
            }),
            hubs: map(this.hubs, function(id, item){
                return item.export(false);
            }),
            tasks: map(this.tasks, function(id, item){
                return item.export(false);
            })
        };
        
        return stringify !== false ? JSON.stringify(result) : result;
    }
};


/////


function History(subject, tasket){
    this.subject = subject;
    this.tasket = tasket;
    this._history = [];
}
History.prototype = {
    push: function(type, data, timestamp){
        if (data){
            this._history.push([type, data, timestamp || now()]);
            
            // If this is a new action, then publish/trigger an event
            if (!timestamp){
                this.tasket.pub(
                    type + "." + this.subject.type,
                    this.subject,
                    data
                );
            }
        }
        return this;
    },
    
    get: function(){
        return this._history;
    },
    
    export: function(stringify){
        var result = this.get();
        return stringify !== false ? JSON.stringify(result) : result;
    }
};


/////


function TaskStub(settings){
    this.tasket = settings.tasket;
    this.id     = settings.id;
    this.owner  = settings.owner;
    this.hub    = settings.hub;
    this.createdTime = settings.createdTime;
}

function HubStub(settings){
    this.tasket  = settings.tasket;
    this.id      = settings.id;
    this.owner   = settings.owner;
    this.hub     = settings.hub;
    this.createdTime = settings.createdTime;
}

function UserStub(settings){
    this.tasket  = settings.tasket;
    this.id      = settings.id;
    this.realname = settings.realname;
    this.image   = settings.image;
    this.createdTime = settings.createdTime;
}

TaskStub.prototype = HubStub.prototype = UserStub.prototype = {
    stub: true
};


/////


function Task(settings){
    var hub, owner;

    this.id = settings.id || tempId();
    this.tasket = settings.tasket;
    this.createdTime = settings.createdTime || now();
    
    this.hub = this.tasket._fullOrStub(
        "hub", settings.hub, Hub, HubStub
    );
    this.owner = this.tasket._fullOrStub(
        "user", settings.owner, User, UserStub
    );
    if (!this.hub){
        throw report("No hub, " + this.id, "task");
    }
    if (!this.owner){
        throw report("No owner, " + this.id, "task");
    }
    
    this.title  = settings.title; // TODO: remove?
    this.description = settings.description;
    this.image  = settings.image;
    this.estimate = settings.estimate;
    
    this.history = new History(this, this.tasket);
    if (!settings.createdTime){
        this.event("created", this.owner, this.createdTime);
    }
    if (this.owner && this.owner.tasksOwned){
        this.owner.tasksOwned[this.id] = this;
    }
}
Task.prototype = {
    type: "task",
    
    event: function(event, user, timestamp){
        timestamp = timestamp || now();
        this[event] = {user:user, time:timestamp};
        this.history.push(event, user, timestamp);
        return this;
    },

    remove: function(user, timestamp){
        return this.tasket.task(this, false);
    },
    
    export: function(stringify){
        var result = {
            id: this.id,
            hub: this.hub && this.hub.id,
            owner: this.owner && this.owner.id,
            title: this.title,
            description: this.description,
            image: this.image,
            estimate: this.estimate,
            history: this.history.export()
        };        
        return stringify !== false ? JSON.stringify(result) : result;
    }
    
    /*
    create: function(user, timestamp){
        return this.event("created", user, timestamp);
    },
    
    assign: function(user, timestamp){
        return this.event("assigned", user, timestamp);
    },
    
    complete: function(user, timestamp){        
        return this.event("completed", user, timestamp);
    },
    
    confirm: function(user, timestamp){
        return this.event("confirmed", user, timestamp);
    }
    */    
};


/////


function Hub(settings){
    this.id     = settings.id || tempId();
    this.tasket = settings.tasket;
    this.createdTime = settings.createdTime;
    
    this.owner = this.tasket._fullOrStub(
        "user", settings.owner, User, UserStub
    );
    if (!this.owner){
        throw report("No owner, " + this.id, "hub");
    }
    
    this.title  = settings.title;
    this.description = settings.description;
    this.image  = settings.image;
    
    this.tasks  = {};
    this.admins = {};
    this.admins[this.owner.id] = this.owner;
    
    this.history = new History(this, this.tasket);
    if (!settings.createdTime){
        this.event("created", this.owner, this.createdTime);
    }
    if (this.owner){
        this.owner.hubsOwned[this.id] = this;
    }
}
Hub.prototype = {
    type: "hub",
    
    event: function(event, user, timestamp){
        timestamp = timestamp || now();
        this[event] = {user:user, time:timestamp};
        this.history.push(event, user, timestamp);
        return this;
    },
    
    isAdmin: function(user){
        return !!(this.admins[user.id]);
    },
    
    admin: function(user, remove){
        if (remove){
            delete this.admins[user.id];
            delete user.hubsAdmined[this.id];
            //this.event("adminRemoved", user);
        }
        else {
            this.admins[user.id] = user;
            user.hubsAdmined[this.id] = this;
            //this.event("adminCreated", user);
        }
        return this;
    },
    
    task: function(task, remove){
        if (!remove){
            task.hub = this;
        }
        return this.tasket.task(task, remove);
    },
    
    remove: function(user){
        this.tasket.hub(this, false);
        // this.event("removed", user);
        return this;
    },
    
    export: function(stringify){
        var result = {
            id: this.id,
            owner: this.owner && this.owner.id,
            title: this.title,
            description: this.description,
            image: this.image,
            tasks: ids(this.tasks),
            admins: ids(this.admins),
            history: this.history.export()
        };        
        return stringify !== false ? JSON.stringify(result) : result;
    }
};


/////


function User(settings){
    this.id = settings.id || tempId();
    this.tasket = settings.tasket;
    //this.username = settings.username;
    this.realname = settings.realname;
    this.image = settings.image;

    this.tasksOwned = {};
    this.hubsOwned = {};
    this.hubsAdmined = {};
    
    this.history = new History(this, this.tasket);
    //this.history.push("created");
}
User.prototype = {
    type: "user",
    
    export: function(stringify){
        var result = {
            id: this.id,
            username: this.username,
            realname: this.realname,
            image: this.image,
            history: this.history.export()
        };        
        return stringify !== false ? JSON.stringify(result) : result;
    }
};


/////

