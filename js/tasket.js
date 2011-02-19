/*global jQuery, console, _, Backbone, tim*/


function now(){
    return (new Date()).getTime();
}

var Tasket, Model, Tasks, Task, TaskStates, Hubs, Hub, User;


// ABSTRACT MODEL
Model = Backbone.Model.extend({
    // required: hub, owner, createdTime || now()
    
    initialize: function(){
        if (!this.get("createdTime")){
            this.set({createdTime: now()});
        }
    }
});

// TASK STATES
TaskStates = {
    NEW     : "new",
    CLAIMED : "claimed",
    DONE    : "done",
    VERIFIED: "verified"
};

// TASK
Task = Model.extend({
    // required: owner
    
    defaults: {
        description: null,
        image: null,
        estimate: null,
        state: TaskStates.NEW
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
    }
});
Task.states = TaskStates;

// TASKS
Tasks = Backbone.Collection.extend({
    model: Task
});

// HUB
Hub = Model.extend({
    // required: owner
    
    defaults: {
        title: null,
        description: null,
        image: null
    },
        
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.tasks = new Tasks();
    }
});

// HUBS
Hubs = Backbone.Collection.extend({
    model: Hub
});

// USER
User = Model.extend({
    // required: realname
    
    defaults: {
        image: null
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.hubsOwned = new Hubs();
        this.tasksOwned = new Tasks();
        this.tasksClaimed = new Tasks();
    }
});


/////


var TaskView = Backbone.View.extend({
    tagName: "li",
    
    _offsetTop: 0,
    _offsetLeft: 0,
    
    events: {
        //"click button": "completeTask"
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        
        if (options.offset){
            this.offsetValues(options.offset);
            delete this.options.offset;
        }
    },
    
    offsetValues: function(offset){
        this._offsetTop  = offset.top;
        this._offsetLeft = offset.left;
        return this;
    },
    
    offsetApply: function(){
        this.elem.offset(this.offset());
        return this;
    },
    
    offset: function(offset){
        if (!offset){
            return {
                top: this._offsetTop,
                left:this._offsetLeft
            };
        }
        return this
            .offsetValues(offset)
            .offsetApply();
    },

    render: function(){
        var data = this.model.toJSON();
        this.elem
            .html(tim("task", data));
            
        return this.offsetApply();
    }
});

var HubView = Backbone.View.extend({
    tagName: "article",

    active: false,
    _offsetTop: 0,
    _offsetLeft: 0,
    
    events: {
        //"click button": "completeTask"
    },
    
    offsetValues: function(offset){
        this._offsetTop  = offset.top;
        this._offsetLeft = offset.left;
        return this;
    },
    
    offsetApply: function(){
        this.elem.offset(this.offset());
        return this;
    },
    
    offset: function(offset){
        if (!offset){
            return {
                top: this._offsetTop,
                left:this._offsetLeft
            };
        }
        return this
            .offsetValues(offset)
            .offsetApply();
    },
    
    addTasks: function(){
        this.collection.each(function(task){ // TODO: trig
            var view = new TaskView({model:task});
            this.$(".tasks").append(view.render().elem);
        }, this);
    },

    render: function(){console.log(2332);
        var data = this.model.toJSON();
        data.isActive = this.active;
        
        this.elem.html(tim("hub", data));
        
        if (this.active){
            this.addTasks();
        }
        return this.offsetApply();
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        
        if (options.offset){
            this.offsetValues(options.offset);
            delete this.options.offset;
        }
        if (options.active){
            this.active = options.active;
            delete this.options.active;
        }
    }
});


/////


// Export API

var myHub = new Hub({
        title: "Foo foo foo",
        description: "Lorem ipsum",
        image: "http://placehold.it/30x30"
    }),
    
    myHubView = new HubView({
        model: myHub,
        
        // options
        active:true,
        offset: {
            top: 100,
            left: 100
        },
        
        collection: new Tasks([
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                user: {
                    name: 'Another User',
                    url: '#/user/another-user/',
                    avatar: 'http://placehold.it/14x14'
                },
                hasUser: true,
                isOwner: false,
                isNotOwner: true,
                showTakeThisButton: false,
                showDoneThisButton: false,
                offset: [-200, -40]
            },
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                user: {
                    name: 'Current User',
                    url: '#/user/current-user/',
                    avatar: 'http://placehold.it/14x14'
                },
                hasUser: true,
                isOwner: true,
                isNotOwner: false,
                showTakeThisButton: false,
                showDoneThisButton: true,
                offset: [-20, -330]
            },
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                user: {},
                hasUser: false,
                isOwner: false,
                isNotOwner: true,
                showTakeThisButton: true,
                showDoneThisButton: false,
                offset: [120, -40]
            }
        ])
    });

jQuery("body")
    .append(myHubView.render().elem);
