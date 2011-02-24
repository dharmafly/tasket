/*global jQuery, console, _, Backbone, tim*/


function now(){
    return (new Date()).getTime();
}

var Tasket = {
        endpoint: "http://localhost:8003/tasket/server/"
    },
    Model, Tasks, Task, TaskStates, Hubs, Hub, User;

// ABSTRACT MODEL
Model = Backbone.Model.extend({
    url: function() {
        var base = Tasket.endpoint + this.type;
        if (this.isNew()) return base;
        return base + (base.charAt(base.length - 1) == "/" ? "" : "/") + this.id;
    },
    
    initialize: function(){
        if (!this.get("createdTime")){
            this.set({createdTime: now()});
        }
    },
    
    report: function(msg){
        return "Tasket" + (this.type ? " " + this.type : "") + ": " + msg + " : " + this.cid;
    },
    
    validate: function(attrs) {
        var missing, report;
    
        if (this.required){
            missing = _.select(this.required, function(property){
                return _.isUndefined(this.get(property));
            }, this);
            
            if (missing.length){
                report = this.report(missing + " required");
                throw report;
                //return report;
            }
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
    
    type: "task",
    required: ["owner", "hub"], // TODO: decide if hub required
    
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
    type: "hub",
    required: ["owner"],
    
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
    type: "user",
    required: ["realname"],
    
    defaults: {
        image: null,
        description: null,
        location: null
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.hubs = {
            owned: new Hubs()
        };
        this.tasks = {
            owned:   new Tasks(),
            claimed: new Tasks()
        };
    }
});


/////


var TaskView = Backbone.View.extend({
    tagName: "li",
    
    events: {
        //"click button": "completeTask"
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
    },
    
    offsetValues: function(offset){
        this.options.offset = offset;
        return this;
    },
    
    offsetApply: function(){
        var offset = this.options.offset;
        if (offset){
            this.elem.offset(offset);
        }
        return this;
    },
    
    offset: function(offset){
        if (offset){
            return this
                .offsetValues(offset)
                .offsetApply();
        }
        return this.options.offset || {
            top:0,
            left:0
        };
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
    
    defaults: {
        offsetTop:0,
        offsetLeft:0,
        selected:false
    },
    
    getset: function(property, value){
        return _.isUndefined(value) ? this.get(property) : this.set(property, value);
    },
    
    get: function(property){
        var value = this.options[property];
        return _.isUndefined(value) ? this.defaults[property] : value;
    },
    
    set: function(property, value){
        this.options[property] = value;
        return this;
    },
    
    isSelected: function(){
        return this.get("selected");
    },
    
    events: {
        //"click button": "completeTask"
    },
    
    offsetValues: function(offset){
        return this.getset("offset", offset);
    },
    
    offsetApply: function(){
        var offset = this.options.offset;
        if (offset){ // only apply offset if it is not the default
            this.elem.offset(offset);
        }
        return this;
    },
    
    offset: function(offset){ // TODO: ensure HubElem or tasksCollection has position:relative
        if (offset){
            return this
                .offsetValues(offset)
                .offsetApply();
        }
        return this.get("offset") || {
            top:  this.defaults.offsetTop,
            left: this.defaults.offsetLeft
        };
    },
    
    addTasks: function(){
    /*
    
    tasks width: (19.321 + (0.923×2) + (0.23075×2)) × 2 = 42.7955 em
    hub: 90 px
    padding: 5em;

    tasks height: (6.4 + (0.923×2) + (0.23075×2)) × 2 = 17.415em
    hub: 90 px
    padding: 5em;
    
    */
    
    
        var container = this.$("div.tasks > ul"),
            containerHalfWidth = container.outerWidth(true) / 2,
            containerHalfHeight = container.outerHeight(true) / 2,
            taskHalfWidth, taskHalfHeight,
            angle = ((2 * Math.PI) / this.collection.length),
            svgElem = this.$("svg"),
            distance = 162;
            
        this.collection.each(function(task, i){
            var view = new TaskView({model:task}),
                top, left;
                
            container.append(view.render().elem);
            
            if (!taskHalfWidth){
                taskHalfWidth  = view.elem.outerWidth(true) / 2;
                taskHalfHeight = view.elem.outerHeight(true) / 2;
            }
            top = Math.round(Math.cos(angle * i) * distance - taskHalfHeight - containerHalfHeight + distance);
            left = Math.round(Math.sin(angle * i) * distance - taskHalfWidth);// + containerHalfWidth - taskHalfWidth
            view.offset({
                top: top,
                left: left
            });
            
        }, this);
    },

    render: function(){
        var data = this.model.toJSON();
        
        data.isSelected = this.isSelected();
        
        this.elem.html(tim("hub", data));
            
        if (data.isSelected){
            this.addTasks();
        }
        return this.offsetApply();
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
    }
});


/////


// Export API

var myHub = new Hub({
        title: "Foo foo foo",
        description: "Lorem ipsum",
        image: "images/placeholder.png",
        owner: "5"
    }),
    
    myHubView = new HubView({
        model: myHub,
        
        // options
        selected: true,
        offset: {
            top: 300,
            left: 500
        },
        
        collection: new Tasks([ // TODO: add these to the hub, not the hubview
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                owner: {
                    name: 'Another User',
                    url: '#/user/another-user/',
                    image: 'images/placeholder.png'
                },
                hub:myHub, // TODO: how does this align with a JSON representation, using the id?
                hasUser: true,
                isOwner: false,
                isNotOwner: true,
                showTakeThisButton: false,
                showDoneThisButton: false
            },
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                owner: {
                    name: 'Current User',
                    url: '#/user/current-user/',
                    image: 'images/placeholder.png'
                },
                hub:myHub,
                hasUser: true,
                isOwner: true,
                isNotOwner: false,
                showTakeThisButton: false,
                showDoneThisButton: true
            },
            {
                description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                owner: {
                    name: 'Current User',
                    url: '#/user/current-user/',
                    image: 'images/placeholder.png'
                },
                hub:myHub,
                hasUser: false,
                isOwner: false,
                isNotOwner: true,
                showTakeThisButton: true,
                showDoneThisButton: false
            }
        ])
    });

jQuery("body").append(myHubView.elem);
myHubView.render();