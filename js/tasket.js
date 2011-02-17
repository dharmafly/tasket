/*global jQuery, console, _, Backbone*/


function now(){
    return (new Date()).getTime();
}

var Tasket, Model, Tasks, Task, Hubs, Hub, User;


// ABSTRACT MODEL
Model = Backbone.Model.extend({
    // required: hub, owner, createdTime || now()
    
    initialize: function(){
        if (!this.get("createdTime")){
            this.set({createdTime: now()});
        }
    }
});

// TASK
Task = Model.extend({
    // required: hub, owner,
    
    defaults: {
        description: null,
        image: null,
        estimate: null
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
    }
});

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
        //Model.prototype.initialize.apply(this, arguments);
        this.hubsOwned = new Hubs();
        this.tasksOwned = new Tasks();
        this.tasksClaimed = new Tasks();
    }
});


/////


var TaskView = Backbone.View.extend({
    tagName: "li",

    render: function(){
        this.el.innerHTML = this.model.get("description");
        return this;
    }
});




/////


// Export API

var tasksElem = jQuery("#tasks");

jQuery("button#newtask")
    .click(function(){
        var view = new TaskView({model:new Task({description:"Lorem ipsum"})});
        tasksElem.append(view.render().el);
    });

