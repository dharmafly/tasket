/*global jQuery, console, _*/

var namespace = "tasket",
    appName = "Tasket",
    version = "0.1.0",
    board,
    undef;

/////

function now(){
    return (new Date()).toString();
}


/////


function Board(){}
Board.prototype = {
    tasks: {},
    users: {},
    hubs: {},
    
    _item: function(item, Constructor, collection){
        var cachedItem = collection && collection[item];
        
        if (!cachedItem){
            if (item.id === undef){
                throw appName + " Board: item has no id";
            }
            if (!item instanceof Constructor){
                item = new Constructor(item);
            }
            collection[item.id] = item;
            return item;
        }
        else if (Constructor === null){
            delete collection[item.id];
            return this;
        }
        
        return cachedItem;
    },
    
    // get/set task
    task: function(task, remove){
        var Constructor = remove === null ? null : Task;
        return this._item(task, Constructor, this.tasks);
    },
    
    // get/set hub
    hub: function(hub, remove){
        var Constructor = remove === null ? null : Hub;
        return this._item(hub, Constructor, this.hubs);
    },
    
    // get/set user
    user: function(user, remove){
        var Constructor = remove === null ? null : User;
        return this._item(user, Constructor, this.users);
    },
    
    // Publish an event
    pub: function(type, item, data){
        console.log(type, data);
    },
    
    // Subscribe to an event
    sub: function(type, callback){
    }
};

function History(subject){
    this.subject = subject;
    this._history = [];
}
History.prototype = {
    push: function(type, data, timestamp){
        if (data){
            this._history.push([type, data, timestamp || now()]);
            
            // If this is a new action, then publish/trigger an event
            if (!timestamp){
                this.board.pub(
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
    }
};

function Task(hub, id, owner){
    this.id = id;
    this.hub = hub;
    this.board = hub.board;
    this.owner = owner;
    this.history = new History(this);
    this.history.push("created", owner);
    this.board.task(this);
}
Task.prototype = {
    type: "task",
    complete: false,
    confirmed: false,
    completedBy: null,
    confirmedBy: null,
    
    completeTask: function(user, timestamp){
        this.completedBy = user;
        this.history("completed", user, timestamp);
        return this;
    },
    
    confirmTask: function(user, timestamp){
        this.confirmedBy = user;
        this.history("confirmed", user, timestamp);
        return this;
    },
    
    remove: function(user, timestamp){
        this.history("removed", user, timestamp);
        this.board.task(this, null);
        return this;
    }
};


/////


function Hub(board, id, owner){
    this.id = id;
    this.board = board;
    this.owner = owner;
    this.tasks = {};
    this.admins = {};
    this.admins[owner.id] = owner;
    this.history = new History(this);
    this.history.push("created", owner);
    board.hub(this);
}
Hub.prototype = {
    type: "hub",
    
    admin: function(user){
        this.admins[user.id] = user;
        return this;
    },
    
    task: function(task){
        this.tasks[task.id] = task;
        return this;
    },
    
    remove: function(user, timestamp){
        this.history("removed", user, timestamp);
        this.board.hub(this, null);
        return this;
    }
};


/////


function User(board, id){
    this.id = id;
    this.board = board;
    this.history = new History(this);
    this.history.push("created");
    board.user(this);
}
User.prototype = {
};
