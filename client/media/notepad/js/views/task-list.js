var TaskListView = View.extend({
    el: "section",
    id: "content",
    
    // Collection of taskView instances, organised by task.cid => taskView  
    taskViews: {},

    // Keep a reference to the currently edited task
    editedTaskView: null,
    
    // Keep a reference to the unsaved task view,
    newTaskView: null,

    // Caches the hub title so it can be restored when cancelling an edit.
    previousTitle: null,
    
    events: {
        "click div.header .edit a": "_onTitleEdit",
        "click div.header .delete a": "_onTitleDelete",
        "click div.header .cancel": "_onTitleEditCancel",
        "click div.header .save": "_onTitleEditSave",
        "mouseover div.header h1 a": "_onTitleMouseover",
        "mouseout div.header h1 a": "_onTitleMouseout",
        "keypress div.header input": "_onKeypressTitle",
        "click a.new-item": "_onNewItemClick",
        "click ul.item-list ul.edit-item li a": "_onControlAction",
        "click li p a.cancel": "_onCancel",
        "click li p a.save": "_onSave",
        "keypress li p input": "_onKeypress",
        "click div.header h1": "_onTitleEditClick",
        "click ul.item-list li p": "_onItemEditClick"
        // "blur input[type='text']": "_onTextInputBlur"
    },

    constructor: function TaskListView () {
        // Display object name in browser console
        Backbone.View.prototype.constructor.apply(this, arguments);
        
    },

    initialize: function (options) {
        this.elem = jQuery(this.el);

        _.bindAll(this,
            "_onModelChangeTitle",
            "_onControlAction",
            "_onCancel",
            "_onKeypress",
            "_onSave",
            "_onSort"
        );

        this.showHub(this.model);
    },

    _setupModelBindings: function(){
        var view = this;

        this.model
            // Unbind first, in case we've displayed this hub before
            .unbind("change:title", this._onModelChangeTitle)
            .bind("change:title", this._onModelChangeTitle);

        this.collection
            // TODO: should these events be unbound first, in case of displaying multiple hubs?
            // display the action controls once a task is saved
            .bind("change:id", function (task, collection) {
                var taskView;

                if (task.get("hub") === view.model.id) {
                    taskView = view.taskViews[task.cid];
                    taskView.showActionControls();
                }
            })
            // Append new items to the list
            .bind("add", function (task, collection) {
                if (task.get("hub") === view.model.id) {
                    view.renderTasks(task);
                }
            })
            
	        //event handler for rendering loaded tasks into the view
	        .bind("reset", function () {
                view.renderTasks();
	        });
	        
            this.bind("remove-item", function(hub){
                view.collection.remove(hub);
            });

            
        return this;
    },

    /*
    * Renders the view.
    *
    * Returns the view's element.
    *
    */
    render: function () {
        var hub = this.model,
            listTitle = hub.get("title"),
            view = this;
            
        this.elem.html(tim("task-list", {listTitle: listTitle}));
        this.itemList = this.$("ul.item-list");
        this.makeSortable();

        return this;
    },

	showHub: function(hub, opts){
		this.model = hub;
		var taskIds;

        if (opts && "showTasksOfType" in opts) {
            switch(opts.showTasksOfType){
                case "all":
                    taskIds = hub.get("tasks.new")
    		                    .concat(hub.get("tasks.claimed"))
    		                    .concat(hub.get("tasks.verified"))
    		                    .concat(hub.get("tasks.done"));
                    break;

                case "onlyDone":
                    taskIds = hub.get("tasks.verified").concat(hub.get("tasks.done"));
                    break;

                case "onlyIncomplete":
                    taskIds = hub.get("tasks.new").concat(hub.get("tasks.claimed"));
                    break;

            }
        }else{
            taskIds = hub.get("tasks.new").concat(hub.get("tasks.claimed"));
        }

        this.collection = Tasket.getTasks(taskIds);
        this._setupModelBindings();
        this.render();
        this.renderTasks();

		return this;
	},

	toggleEdit: function(){
		this._onTitleEdit();
	},
    
    hideAddEditControls: function(){
        // hide editing controls - used when viewing starred items
        this.$("div.header ul.edit-item").add("#content a.new-item").hide();
    },

    showAddEditControls: function(){
        this.$("div.header ul.edit-item").add("#content a.new-item").show();
    },

    makeSortable: function () {
        this.itemList.sortable({
            handle: ".move",
            axis: "y",
            update: this._onSort
        });

        return this;
    },

    _onSort: function (event) {
        var view = this,
            hub = this.model,
            tasks = this.collection,
            ids = jQuery.map(this.itemList.children(), function (item) {
                var cid = view.getCidFromElement(item),
                    task = tasks.getByCid(cid);

                return task && task.id;
            });

        hub.set({"tasks.order": ids}).save();
    },

    /*
    * Public: Appends one or several tasks items to the view.
    *
    * For each task provided a new TaskView instance will be created and rendered. This
    * view will keep track or appended instances by appending them in the #taskViews array.
    *
    * tasks - a single or an array of task model instances.
    */
    renderTasks: function () {
        var view = this,
            itemList = this.itemList,
            taskView;
            
		this.itemList.empty();
        this.collection.each(function (task) {
            taskView = new TaskView({model: task, collection: view.collection});
            view.taskViews[task.cid] = taskView;
            itemList.append(taskView.render().el);

            // new item
            if (task.isNew()) {
                view.newTaskView = taskView;
                taskView.makeEditable();
            }
        });
    },

   /*
   * Orders the task collection according to the sequence made
   * explicit in the hub "tasks.order" attribute.
   *
   *
   * tasks - a task collection.
   *
   * Returns an array of sorted tasks.
   *
   */
    _orderTasks: function (tasks) {
        var orderedIds = this.model.get("tasks.order"),
            output = [];

        if (!_.isArray(orderedIds)) {
            return tasks;
        }
        
        _.each(orderedIds, function (id) {
            var task = _.detect(tasks, function (aTask){
                return aTask.id === id;
            });

            if (task) {
                output.push(task);
            }
        });

        _.each(tasks, function (task) {
            if (!_.include(orderedIds, task.id)) {
                output.push(task);
            }
        });

        return output;
    },
    
    // Triggered by a model change:title event
    _onModelChangeTitle: function(task){
        this._resetTitle(task.get("title"));
    },
	
    _onTitleEdit: function (event) {
        var listTitle = this.previousTitle =  this.$("div.header h1 a").text(),
            html = jQuery(tim("title-edit", {placeholder: app.lang.NEW_HUB})),
            headingWidth = this.$("div.header h1 a").width();

        this.$("div.header").addClass("edit-mode");
        this.$("div.header h1").replaceWith(html);
        this.$("div.header input").val(listTitle).putCursorAtEnd();
		if (event) {
			event.preventDefault();
		}
        
        // adjust title width based on input
        this.$("div.header input").css("width", headingWidth+10+"px");
    },

    _onTitleDelete: function (event) {
        if(confirm("Remove this list and all assigned tasks?")){
            // instead of this.model.destroy(); we use archive due to limits set by the API
            // (unable to delete hubs that have completed items, only archive)
            this.model.archive();
        }
    },
    
    _onTitleEditSave: function (event) {
        var newTitle = this.$("div.header input").val();
        if (newTitle === this.model.get("title")) {
            this._resetTitle(newTitle);
            return;
        };

        if (_.isEmpty(newTitle)) {
            newTitle = app.lang.EMPTY_HUB;
        }
        this._saveTitle(newTitle);
        event.preventDefault();
    },

    _onTitleEditCancel: function (event) {
        this._resetTitle(this.previousTitle);
        event.preventDefault();
    },

    _saveTitle: function (title) {
        this.model.set({title: title});
        this.model.save();
		if (this.model.isNew()) {
			this.trigger("create-hub", this.model);
		} else {
			this.trigger("update-hub", this.model);
		}
    },

    _onKeypressTitle: function (event) {
        var newTitle = jQuery(event.target).val(),
            newCharCount = newTitle.length,
            previousCharCount = jQuery(event.target).data("charCount"),
            width = jQuery(event.target).width();

        if (_.isEmpty(newTitle)) {
            newTitle = app.lang.EMPTY_HUB;
        }
        
        // adjust width of input box if we've got a new character, 
        // and if the string length is longer now than it has been previously 
        if (!previousCharCount || newCharCount > previousCharCount) {
            this.$("div.header input").css("width", width+10+"px");
            jQuery(event.target).data("charCount", newCharCount);
        }

        // Return and tab keys
        if (_.include([13, 9], event.which)) {
            var newTitle = this.$("div.header input").val();
            if (newTitle === this.model.get("title")) {
                this._resetTitle(newTitle);
                return;
            }
            
            this._saveTitle(newTitle);
        }
    },

    _resetTitle: function (title) {
        if (_.isEmpty(title)) {
            title = app.lang.EMPTY_HUB;
        }

        this.$("div.header input").replaceWith(
            jQuery("<h1><a href='#'>"+title+"</a></h1>")
        );
        this.$("div.header .cancel, div.header .save").remove();
        this.$("div.header").removeClass("edit-mode");        
    },

    _onTitleMouseover: function (event) {
        this.$("div.header").addClass("hover");
        event.preventDefault();
    },

    _onTitleMouseout: function (event) {
        this.$("div.header").removeClass("hover");
        event.preventDefault();
    },
    
    /*
    * Handles the click event fired by the new item link
    */
    _onNewItemClick: function (event) {
        // If there is already a new item that's been created, then save it
        if (this.newTaskView) {
            this.$("a.save").click();
            return false;
        }

        // If another item is being edited, then reset it.
        if (this.editedTaskView) {
            this.editedTaskView.reset();
            this.editedTaskView = null;
        }
        this.createTask();
        
        event.preventDefault();
        return this;
    },

    /*
    * Triggers the "update-item" event and expands a new insert item input if 
    * the task is new.
    *
    * task        - An instance of the Task model.
    * description - The todo item description.
    */
    _saveNewItem: function (task, description) {
        this.newTaskView = null;
        
        if (task.isNew()) {
            this.$("a.new-item").click();
        }
        this.trigger("update-item", task, {description: description});
    },
    
    createTask: function(){
        var newTask = new Task({
            hub: app.selectedHub.id,
            owner: app.currentUser.id,
            estimate: Tasket.settings.TASK_ESTIMATE_MAX
        });

        this.collection.add(newTask);
        return this;
    },
    
    // Get a Backbone model's clientId from a DOM element in the view
    getCidFromElement: function(el){
        var elem = jQuery(el),
            cid = elem.data("cid") || elem.parents("li[data-cid]").data("cid");

        return cid;
    },

    /*
    *
    * Returns the taskView instance associated to an event target element
    * element - An event target element
    */
    _getElementView: function (el) {
        return this.taskViews[this.getCidFromElement(el)];
    },

    /*
    * Handles all action events delegated to the .item-list element on initialisation.
    * Looks at the event target parent element and calls a view method to process that action.
    */
    _onControlAction: function (event) {
        var el = event.target,
            cid = this.getCidFromElement(el),
            parentClass = el.parentNode.className,
            action = parentClass && parentClass.split(" ")[0],
            // find the appropriate view method
            methodName = action && "_on" + action[0].toUpperCase() + action.slice(1);
        
        if (methodName && this[methodName]) {
            this[methodName](cid, el);
        }
        else {
            throw "taskListView._onControlAction: " + methodName + " not found";
        }
        
        event.preventDefault();
    },

    // a click on the item title will find the edit icon & fire that control
    _onItemEditClick: function(e) {
        if (e.target.nodeName.toUpperCase() == "P") {
            // re-assign the click target to be the edit icon
            e.target = $(e.target).parents("li")
                        .find("li.edit a").get(0);

            this._onControlAction(e);
        };
        
    },
    
   /**
    * Handles the "delete" action.
    * Triggers the "remove-item" event and passes along the cid of the selected task.
    *
    * cid    - The cid of a Task instance.
    * target - The event target element (optional).
    */
    _onDelete: function (cid, target) {
        var taskView = this.taskViews[cid];
        taskView.remove();
        this.trigger("remove-item", taskView.model);
    },

   /**
    * Handles the "edit" action.
    *
    * cid - The cid of a Task instance.
    *
    * target - The event target element.
    */
    _onEdit: function (cid, target) {
        var taskView = this.taskViews[cid];

        // cancel all active edits
        this.$("a.cancel").click();

        // Do nothing if the user is already editing this same task.
        if (this.editedTaskView && taskView === this.editedTaskVew ) {
            return false;
        }
        else {
            this.editedTaskView = taskView;
            taskView.makeEditable();
        }
        
    },

    // double click the title to envoke the title edit
    _onTitleEditClick: function(e) {
        this._onTitleEdit(e);
    },
    
   /*
    * Handles the _onTick action and triggers the "update-item" event passing along 'state:"done"' and 'claimedBy:<currentUserId>' as update values.
    */
    _onTick: function (cid, target) {
        var currentUserId = app.currentUser.id,
            task = this.collection.getByCid(cid),
            forceMode = true,
            state = task.get("state"),
            newState = state === Task.states.VERIFIED || state ===  Task.states.DONE ?
                Task.states.NEW : Task.states.DONE;

        task.state(newState, currentUserId, forceMode)
            .save();
    },

   /*
    * Handles the _onStar action
    */
    _onStar: function (cid, target) {
        var task = this.collection.getByCid(cid);
        
        if (task.get("starred.id")){
            task.unstar();
        }
        else {
            task.star();
        }
    },

    /*
    * Handles the cancel edit event.
    *
    */
    _onCancel: function (event) {
        var taskView = this._getElementView(event.target);
        this.newTaskView = null;

        if (taskView.model.isNew()) {
            taskView.remove();
            this.trigger("remove-item", taskView.model);
        } else {
            taskView.reset();
        }

        this.editedTaskView = null;
        event.preventDefault();
    },

    cancelEdit: function(){
        this.$("a.cancel").click();
    },

    /*
    * Handles the onChange event on the editing input field.
    */
    _onKeypress: function (event) {    
        if (_.include([9,13], event.which)) {
            this._onSave(event);
            // TODO: on edit, and press RETURN -> go on to edit next item down
        }
    },

    _onSave: function (event) {
        var taskView = this._getElementView(event.target),
            description = taskView.$("input").val(),
            task = taskView.model;
            
        if (description !== task.get("description")){
            this._saveNewItem(task, description, event.target);
        }
        else {
            this._onCancel(event);
        }
        event.preventDefault();
    }
});
