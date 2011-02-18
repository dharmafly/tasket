/*global jQuery, console, _, Backbone*/


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
    _offset: {
        top: 0,
        left: 0
    },
    
    events: {
        //"click button": "completeTask"
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        if (options.offset){
            this.offset(options.offset);
        }
    },
    
    offset: function(offset){
        if (offset){
            this._offset = offset;
        }
        this.elem.offset(this._offset);
        return this;
    },

    render: function(){
        var data = this.model.toJSON();
        this.elem
            .html(tim("task", data));
            
        return this.offset();
    }
});

var HubView = Backbone.View.extend({
    tagName: "article",
    active: false,
    _offset: {
        top: 0,
        left: 0
    },
    
    events: {
        //"click button": "completeTask"
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        if (options.offset){
            this.offset(options.offset);
        }
    },
    
    offset: function(offset){
        if (offset){
            this._offset = offset;
        }
        this.elem.offset(this._offset);
        return this;
    },

    render: function(){
        var data = this.model.toJSON();
        data.isActive = this.active;
        
        this.elem.html(tim("hub", data));
        
        this.collection.each(function(task){
            var view = new TaskView({model:task});
            this.$(".tasks").append(view.render().elem);
        }, this);
            
        return this.offset();
    }
});


(function () {
    // Temporarily position the projects & tasks for styling.
    var project = $('article'),
        tasks = [
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
        ];

    if (project.length) {
	    project.css({
		    top: '40%',
		    left: '40%'
	    });

	    $.each(tasks, function (index, task) {
		    var html = tim('task', task),
		        element = $(html);

		    element.css({
			    top:  task.offset[0],
			    left: task.offset[1]
		    }).appendTo(project.find('.tasks'));
	    });
    }
    });



/////


// Export API

var myHub = new HubView({
    model: new Hub({
        title: "Foo foo foo",
        description: "Lorem ipsum",
        image: "http://placehold.it/30x30"
    }),
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
    ]),
    offset: {
        top: 100,
        left: 100
    },
    active:true
});

jQuery("body")
    .append(myHub.render().elem);
