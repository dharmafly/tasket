/*global jQuery, console, _, Backbone, tim*/


function now(){
    return (new Date()).getTime();
}

function truncate(str, charLimit, continuationStr){
    if (str && str.length > charLimit){
        continuationStr = continuationStr || "…";
        return str
            .slice(0, charLimit + continuationStr.length)
            .replace(/\W?\s\S*$/m, "") +
            continuationStr;
    }
}


var Tasket, Model, CollectionModel, TaskList, Task, TaskStates, HubList, Hub, User, UserList, Notification, HubView, TaskView;

// ABSTRACT MODEL
Model = Backbone.Model.extend({
    url: function() {
        var base =  Tasket.endpoint + this.type + "s/";
        return this.isNew() ? base : base + this.id;
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
    
        // Validate if this is not a stub of a model with just an id - i.e. only on creating from scratch
        if (!this.id && this.required){
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

CollectionModel = Backbone.Collection.extend({
    initialize: function(){
        this.type = this.model.prototype.type;
    },

    url: function(){
        var base = Tasket.endpoint + this.type + "s/";
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        return this.seed && !this.length ? base : base + "?ids=" + this.pluck("id");
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

// TASKS COLLECTION
TaskList = CollectionModel.extend({
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
        this.tasks = new TaskList(); // TODO: replace with array of ids
    }
});

// HUBS COLLECTION
HubList = CollectionModel.extend({
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
            owned: new HubList()
        };
        this.tasks = {
            owned:   new TaskList(),
            claimed: new TaskList()
        };
    }
});

// USERS COLLECTION
UserList = CollectionModel.extend({
    model: User
});


/////


// TASKET OBJECT
Tasket = {
    endpoint: "http://tasket.ep.io/",
    // endpoint: "http://localhost:8000/",
    hubDescriptionTruncate: 30, // No. of chars to truncate hub description to. TODO: move to a different object?
    
    hubs: new HubList(),
    tasks: new TaskList(),
    users: new UserList(),
    
    notifier: _.extend({}, Backbone.Events),
    
    // Helper function for fetching multiple collections and models in one go, with a callback on completion
    fetchAndAdd: function fetchAndAdd(ids, collection, callback){
        // Keep track of fetched collections, and trigger event on completion
        function callbackIfComplete(){
            if (!--fetchAndAdd.pending){
                Tasket.notifier.trigger("fetchComplete", true);
                Tasket.notifier.unbind("fetchComplete");
            }
        }
    
        var changedIds = [],
            fetchOptions = {
                // Trigger event on error
                error: function(){
                    Tasket.notifier.trigger("fetchComplete", false);
                    Tasket.notifier.unbind("fetchComplete");
                },
                // Send supplied callback, and final trigger on completion
                success: callback ?
                    function(model, instance){
                        callback(model, instance);
                        callbackIfComplete();
                    } :
                    callbackIfComplete
            };
        
        // Start counting
        if (_.isUndefined(fetchAndAdd.pending)){
            fetchAndAdd.pending = 0;
        }
        
        // Accept a single id, or array of ids
        if (!_.isArray(ids)){
            ids = [ids];
        }
        
        // Add each id to the collection
        _.each(ids, function(id){
            if (!collection.get(id)){
                changedIds.push(id);
                collection.add(
                    new collection.model({id:id})
                );
            }
        });
        
        // Fetch the whole collection
         // TODO: only fetch subset of models just added
        if (changedIds.length){
            fetchAndAdd.pending ++;
            collection.fetch(fetchOptions);
        }
    },
    
    // Bootstrap data on page load: fetch all open hubs, their owners and tasks, and the users involved in those tasks
    initData: function(callback){
        var pending = 0,
            hubs = this.hubs,
            tasks = this.tasks,
            users = this.users,
            fetchAndAdd = this.fetchAndAdd,
            fetchOptions = {
                success: function(){
                    fetchAndAdd(hubs.pluck("tasks"), tasks, function(){
                        var usersToFetch = _([
                                hubs.pluck("owner"),
                                tasks.pluck("owner"),
                                tasks.pluck("claimedBy")
                            ])
                            .chain()
                            .flatten()
                            .unique()
                            .compact()
                            .value();
                            
                        fetchAndAdd(usersToFetch, users);
                    });
                }
            };
        
        if (callback){            
            fetchOptions.error = function(){
                callback(false);
            };
            Tasket.notifier.bind("fetchComplete", callback);
        }
            
        hubs.seed = true;
        hubs.fetch(fetchOptions);
                
        return this;
    }
};



/////


TaskView = Backbone.View.extend({
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
        
        data.hasUser = !!data.claimedBy;
        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = data.claimedBy === Tasket.MY_USER_ID; // TODO
        
        // TODO: make more elegant in Tim? Or use blank strings as default?
        _(data).each(function(value, key){
            if (data[key] === null){
                data[key] = "";
            }
        });
        
        this.elem
            .html(tim("task", data));
            
        return this.offsetApply();
    }
});

HubView = Backbone.View.extend({
    tagName: "article",
    
    defaults: {
        offsetTop:0,
        offsetLeft:0,
        selected:false
    },
    
    eventProxy: _.extend({}, Backbone.Events),
    
    getset: function(property, value){
        return _.isUndefined(value) ? this.get(property) : this.set(property, value);
    },
    
    get: function(property){
        var value = this.options[property];
        return _.isUndefined(value) ? this.defaults[property] : value;
    },
    
    set: function(property, value){
        this.options[property] = value;
        this.eventProxy.trigger("set", property, value);
        return this;
    },
    
    isSelected: function(){
        return this.get("selected");
    },
    
    events: {
        "click": "toggleSelected"
    },
    
    toggleSelected: function(){
        if (this.isSelected()){
            return this.deselect();
        }
        return this.select();
    },
    
    select: function(){
        this.set("selected", true);
        this.eventProxy.trigger("select"); // TODO: should this be on the model, not the view?
        this.elem.addClass("select");
        this.renderTasks();
        return this;
    },
    
    deselect: function(){
        this.set("selected", false);
        this.eventProxy.trigger("deselect");
        this.elem.removeClass("select");
        this.clearTasks();
        return this;
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
    
    renderTasks: function(){
    /*
    
    tasks width: (19.321 + (0.923×2) + (0.23075×2)) × 2 = 42.7955 em
    hub: 90 px
    padding: 5em;

    tasks height: (6.4 + (0.923×2) + (0.23075×2)) × 2 = 17.415em
    hub: 90 px
    padding: 5em;
    
    */
        // TODO temp
        this.collection = new TaskList(
            _(this.model.attributes.tasks)
                .map(function(id){
                    return {id:id};
                })
        );
    
        var container = this.$("div.tasks > ul"),
            containerHalfWidth = container.outerWidth(true) / 2,
            containerHalfHeight = container.outerHeight(true) / 2,
            taskWidth, taskHeight, taskHalfWidth, taskHalfHeight,
            angle = ((2 * Math.PI) / this.collection.length),
            //svgElem = this.$("svg"),
            distance = 162;
            
            // TEMP: show distance boundary
            container.append("<li style='border:3px solid #3c3; position:absolute; top:-162px; left:-162px; width:324px; height:324px; border-radius:30em; -moz-border-radius:30em; background-color:transparent; padding:0;' id='foo'></li>");
            
        this.collection.each(function(task, i){
            var view = new TaskView({model:task}),
                top, left;
                
            container.append(view.render().elem);
            
            if (!taskWidth){
                taskWidth  = view.elem.outerWidth(true);
                taskHeight = view.elem.outerHeight(true);
                taskHalfWidth  = view.elem.outerWidth(true) / 2;
                taskHalfHeight = view.elem.outerHeight(true) / 2;
            }
            top = Math.round(Math.cos(angle * i) * distance) - (distance / 2);
            left = Math.round(Math.sin(angle * i) * distance) - (distance / 2);
            
            /*
            if (left < 0){
                left += (left / (distance * 2)) * taskWidth;
            }
            else {
                left += (left / (distance * 2)) * taskWidth * 2;
            }
            */
            
            view.offset({
                top: top,
                left: left
            });
            
        }, this);
        
        return this;
    },
    
    clearTasks: function(){
        var container = this.$("div.tasks > ul");
        container.empty();
        return this;
    },

    render: function(){
        var data = this.model.toJSON(),
            desc = data.description;
        
        data.isSelected = this.isSelected();
        data.description = truncate(data.description, Tasket.hubDescriptionTruncate);
        
        this.elem.html(tim("hub", data));
            
        if (data.isSelected){
            this.renderTasks();
        }
        return this.offsetApply();
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
    }
});


// NOTIFICATION

Notification = Backbone.View.extend({
    tagName: "div",

    className: "notification",

    events: {
        'click .close': 'hide'
    },

    initialize: function () {
        this.elem = $(this.el);
        this.render();
        this.contentElem = this.elem.find(".notification-content");
        jQuery("body").prepend(this.elem);
        _.bindAll(this, "_onKeyPress");
    },

    render: function () {
        this.elem.html('<div class="notification-content"></div><button class="close">Close</button>');
        return this;
    },

    message: function (message) {
        this.contentElem.html(message);
        return this;
    },

    status: function (status) {
        var elem = this.elem,
            statuses = Notification.status;
        
        status = status || statuses.SUCCESS;
        
        if (!elem.hasClass(status)) {
            _(statuses).each(function (value) {
                elem.removeClass(value);
            });
            elem.addClass(status);
        }
        return this;
    },

    show: function (message, status) {
        if (!_.isUndefined(message)){
            this.message(message);
        }
        if (!_.isUndefined(status)){
            this.status(status);
        }
        
        $(window).bind('keyup', this._onKeyPress);
        $(document.body).addClass('show-notification');
        return this;
    },

    hide: function () {
        $(window).unbind('keyup', this._onKeyPress);
        $(document.body).removeClass('show-notification');
        return this;
    },
    
    success: function (message) {
        return this.show(message, Notification.status.SUCCESS);
    },
    
    warning: function (message) {
        return this.show(message, Notification.status.WARNING);
    },
    
    error: function (message) {
        return this.show(message, Notification.status.ERROR);
    },

    _onKeyPress: function (event) {
        if (event.keyCode === 27) {
            this.hide();
        }
    }
});

Notification.status = {
    ERROR:   "error",
    WARNING: "warning",
    SUCCESS: "success"
};

/////


// LANGUAGE
Tasket.lang = {
    LOADING:        "Loading...",
    DOWNLOAD_ERROR: "There was a problem downloading data from the server"
};


/////


var dummyCode = false,
    // TODO: part of ui object?
    notification = new Notification();

function draw(success){
    var body = jQuery("body"),
        hubView;

    if (success){
        notification.hide();
        Tasket.hubs.each(function(hub){
            hubView = new HubView({
                model: hub,
               
                offset: {
                    top: 300,
                    left: 500
                },
            }).render();
            
            body.append(hubView.elem);
            
            // TODO: temp
            window.hubView = hubView;
        });
    }
    else {
        notification.error(Tasket.lang.DOWNLOAD_ERROR);
    }
}

/////

if (dummyCode){
    drawDummyData();
}
else {
    // Timeout required to prevent notification appearing immediately (seen in Chrome)
    window.setTimeout(function(){
        notification.warning(Tasket.lang.LOADING);
    }, 0);

    // Get data from the server and draw
    Tasket.initData(draw);
}

function drawDummyData(){
    notification.hide();

    var myHub = new Hub({
            title: "Foo foo foo",
            description: "Lorem ipsum",
            image: "media/images/placeholder.png",
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
            
            collection: new TaskList([ // TODO: add these to the hub, not the hubview
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Another User',
                        url: '#/user/another-user/',
                        image: 'media/images/placeholder.png'
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
                        image: 'media/images/placeholder.png'
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
                        image: 'media/images/placeholder.png'
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
}
