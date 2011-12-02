var TaskListView = View.extend({
    el: "section",
    
    // Because the view has an id of "content", it will replace the existing #content element
    id: "content",
    
    // Collection of taskView instances, organised by task.cid => taskView  
    taskViews: {},

    // Keep a reference to the currently edited task
    activeTask: null,

    // Caches the hub title so it can be restored when cancelling an edit.
    previousTitle: null,
    
    events: {
        "click div.header .edit a": "_onTitleEdit",
        "click div.header .delete a": "_onTitleDelete",
        "click div.header .cancel": "_onTitleEditCancel",
        "click div.header .save": "_onTitleEditSave",
        "mouseover div.header h1 a": "_onTitleMouseover",
        "mouseout div.header h1 a": "_onTitleMouseout",
        "keyup div.header input": "_onKeyupTitle",
        "click a.new-item": "_onCreate",
        "click ul.item-list ul.edit-item li a": "_onControlAction",
        "click li p a.cancel": "_onCancel",
        "click li p a.save": "_onSave",
        "keyup li p input": "_onKeyup",
        "click div.header h1": "_onTitleEditClick",
        "click ul.item-list li p": "_onTaskEditClick"
        // "blur input[type='text']": "_onTextInputBlur"
    },

    constructor: function TaskListView () {
        // Display object name in browser console
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        this.elem = jQuery(this.el);
        this.mainContentElem = jQuery("#main");

        _.bindAll(this,
            "_onModelChangeTitle",
            "_onControlAction",
            "_onCancel",
            "_onKeyup",
            "_onSave",
            "saveTaskOrder",
            "_tempRenderHubList"
        );

        if (this.model){
            this.showHub(this.model);
        }
    },
    
    // TODO: TEMP HACK - need to properly trigger methods in hubListView
    _tempRenderHubList: _.debounce(function(){
        app.controller.hubListView.renderHubs();
    }, 250),

    _setupBindings: function(){
        var view = this;
        
        this.model
            // Unbind first, in case we've displayed this hub before
            .unbind("change:title", this._onModelChangeTitle)
            .bind("change:title", this._onModelChangeTitle)
            .unbind("change", this._tempRenderHubList)
            .bind("change", this._tempRenderHubList);

        this.collection
            // proxy to the view
            .bind("all", function(){
                view.trigger.apply(view, arguments);
            })
            
            // display the action controls once a task is saved
            .bind("change:id", function (task) {
                if (task.get("hub") === view.model.id) {
                    view.getTaskView(task).showActionControls();
                }
            })
            
            .bind("remove", function(task){
                if (!task.isNew() && Tasket.tasks.get(task.id)) {
                    view.deleteTask(task);
                }
            })
            
            // event handler for rendering loaded tasks into the view
            .bind("reset", function () {
                view.renderTasks();
            });
            
        return this;
    },

    render: function () {
        var hub = this.model,
            listTitle = hub.get("title");
        
        this.elem.html(tim("task-list", {listTitle: listTitle}))

        // Create a list of tasks
        this.taskListElem = this.$("ul.item-list");

        return this.makeSortable();
    },

    /*
    * Appends one or several tasks items to the view.
    * For each task, a new TaskView instance will be created and rendered.
    * Populates the #taskViews array.
    */
    renderTasks: function () {
        var view = this;

        this.emptyTaskList();
        this.collection
            // Sort into order - TODO: why is this sort required to force the comparator?
            .sort({silent:true})
            // Render each taskView
            .each(function (task) {
                var taskView = view.getTaskView(task) || view.createTaskView(task);
                view.appendTaskView(taskView.render());
            });
        
        return this;
    },
    
    getTaskView: function(task){
        return this.taskViews[task.cid];
    },
    
    createTaskView: function(task){
        return this.taskViews[task.cid] = new TaskView({model: task, collection: this.collection});
    },
    
    appendTaskView: function(taskView){
        this.taskListElem.append(taskView.el);
        return this;
    },

    showHub: function(hub, opts){
        var taskIds;
        
        this.model = hub;
        
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
        }
        else {
            taskIds = hub.get("tasks.new").concat(hub.get("tasks.claimed"));
        }

        // A collection of ordered tasks
        this.collection = Tasket.getTasks(taskIds);
        this.collection.comparator = function(task){
            var orderedIds = hub.get("tasks.order");
            return _.indexOf(orderedIds, task.id);
        };
        
        this._setupBindings()
            .render()
            .renderTasks();

        // If no tasks yet on this list and the title has never been updated, then enter edit mode
        if (!this.model.countTasks()){
            this.enterEditMode();
        }
        
        return this;
    },
    
    hasDefaultTitle: function(){
        return this.model.get("title") === app.lang.NEW_HUB;
    },

    enterEditMode: function(){
        // If the title has never been changed, then edit it.Otherwise, add a new item
        return this.hasDefaultTitle() ?
            this._onTitleEdit() : this.createTask();
    },
    
    saveTaskOrder: function(){
        var view = this,
            hub = this.model,
            tasks = this.collection,
            ids = jQuery.map(this.taskListElem.children(), function (item) {
                var cid = view.getCidFromElement(item),
                    task = tasks.getByCid(cid);

                return task && task.id;
            });

        hub.set({"tasks.order": ids}).save();
        return this;
    },
    
    // Triggered by a model change:title event
    _onModelChangeTitle: function(task, newTitle){
        return this._resetTitle(newTitle);
    },
    
    _onTitleEdit: function (event) {
        var headerElem = this.$("div.header"),
            h1Elem = headerElem.find("h1"),
            titleElem = h1Elem.find("a"),
            headingWidth = titleElem.width(),
            listTitle = this.previousTitle = titleElem.text(),
            html = jQuery(tim("title-edit", {placeholder: app.lang.NEW_HUB})),
            inputElem;

        headerElem.addClass("edit-mode");
        h1Elem.replaceWith(html);
        inputElem = headerElem.find("input")
            .val(listTitle)
            .focus();
        
        if (this.hasDefaultTitle()){
            inputElem.select();
        }
        else {
            inputElem.putCursorAtEnd();
        }
        
        // adjust title width based on input
        inputElem.css("width", headingWidth+10+"px");
        
        if (event) {
            event.preventDefault();
        }
        return this;
    },
    
    _onTitleEditSave: function () {
        var newTitle = this.$("div.header input").val();

        if (_.isEmpty(newTitle)) {
            newTitle = app.lang.EMPTY_HUB;
        }
        
        if (newTitle === this.model.get("title")) {
            this._resetTitle(newTitle);
        }
        else {
            this._saveTitle(newTitle);
        }
            
        // If the list title has been edited, and no tasks exist on the list, then add a new task
        if (!this.model.countTasks()){
            this.createTask();
        }
        return false;
    },

    _onTitleDelete: function (event) {
        var hub;
    
        if (confirm("Remove this list and all assigned tasks?")){
            hub = this.model;
            
            // If the hub has active tasks, then archive rather than deleting
            if (hub.canDelete()){
                hub.destroy();
            }
            else {
                hub.archive();
            }
        }
        return this;
    },

    _saveTitle: function (title) {
        this.model.save({title: title});
        return this;
    },

    _onTitleEditCancel: function () {
        this._resetTitle(this.previousTitle);
        return false;
    },

    _onKeyupTitle: function (event) {
        var keyCode = event.keyCode ?
            event.keyCode : event.which;
        
        // RETURN & TAB keys
        // TODO: TAB (9) seems non-functional [Chrome 16]
        if (keyCode === 13 || keyCode === 9){
            this._onTitleEditSave();
            return false;
        }
        // ESc - to exit editing or creating a task
        else if (keyCode === 27){
            this._onTitleEditCancel();
            return false;
        }
    },

    _resetTitle: function (title) {
        if (_.isEmpty(title)) {
            title = app.lang.EMPTY_HUB;
        }

        this.$("div.header input, div.header h1").replaceWith(
            jQuery("<h1><a href='#'>"+title+"</a></h1>")
        );
        this.$("div.header .cancel, div.header .save").remove();
        this.$("div.header").removeClass("edit-mode");
        return this;      
    },

    makeSortable: function () {
        this.taskListElem.sortable({
            handle: ".move",
            axis: "y",
            update: this.saveTaskOrder
        });
        return this;
    },
    
    activeTaskView: function(){
        return this.activeTask && this.taskViews[this.activeTask.cid];
    },
    
    /////
    
    // EDITING
    
    emptyTaskList: function(){
        this.taskListElem.empty();
        return this;
    },
    
    taskHasDefaultTitle: function(task){
        return task.get("title") === app.lang.NEW_TASK;
    },
    
    createTask: function(){
        var hubId = this.model.id,
            task = new Task({
                hub: hubId,
                owner: app.currentUser.id
            }),
            taskView = this.createTaskView(task).render();
        
        this.collection.add(task);
        this.appendTaskView(taskView.makeEditable());
        
        // Save active task, then cache and edit the new one
        return this.editTask(task);
    },
    
    inTaskEditMode: function(){
        return !!this.activeTask;
    },
    
    editTask: function(task){
        if (task){
            // Save active task
            this.saveTask(this.activeTask);
            
            // Cache new active task
            this.activeTask = task;
            
            // Make editable
            this.getTaskView(task)
                .makeEditable();
        }
        return this;
    },

    cancelEdit: function(task){
        var taskView;
            
        if (task){
            taskView = this.getTaskView(task);
            
            if (task.isNew()){
                // Remove from view
                taskView.remove();
                
                // Remove from collection
                this.collection.remove(task);
            }
            else {
                // Reset state
                taskView.reset();
            }
            this.activeTask = null;
        }
        return this;
    },
    
    saveTask: function(task, createFollowOn){
        var taskView, oldDesc, newDesc, hub, request;
        
        if (task){
            taskView = this.getTaskView(task);
            oldDesc = task.get("description");
            newDesc = taskView.$("input").val();
            
            if (!newDesc || oldDesc === newDesc){
                // No changes; cancel save
                this.cancelEdit(this.activeTask);
            }
            else {
                this.updateTask(task, {description: newDesc});
                
                // If a new task, then create another
                if (createFollowOn && task.isNew()){
                    this.activeTask = null;
                    this.createTask();
                }
            }
        }
        return this;
    },
    
    updateTask: function(task, attr){
        if (task){
            // Set a default description
            if ("description" in attr && _.isEmpty(attr.description)) {
                attr.description = app.lang.NEW_TASK;
            }
            task.save(attr);
        }
        return this;
    },
    
    deleteTask: function(task){
        var request;
    
        // Remove from the server
        if (task.canDelete()){
            task.destroy();
        }
    
        // Can't delete done tasks; need to change them to "new" first - see https://github.com/dharmafly/tasket/issues/426
        else {
            task.state("new", app.currentUser.id);
            request = task.save();
            request.success(function(){
                task.destroy();
            });
        }
        return this;
    },
    
    /////
    
    // Get a Backbone model's clientId from a DOM element in the view
    getCidFromElement: function(el){
        var elem = jQuery(el),
            cid = elem.data("cid") || elem.parents("li[data-cid]").data("cid");

        return cid;
    },

    /*
    * Returns the taskView instance associated to an event target element
    * element - An event target element
    */
    _getElementView: function (el) {
        return this.taskViews[this.getCidFromElement(el)];
    },
    
    /////
    
    // EDIT HANDLERS

    _onSave: function() {
        this.saveTask(this.activeTask, true);
        return false;
    },

    _onCancel: function() {
        this.cancelEdit(this.activeTask);
        return false;
    },
    
    _onKeyup: function (event) {
        var keyCode = event.keyCode ?
            event.keyCode : event.which;
        
        // RETURN & TAB keys
        // TODO: TAB (9) seems non-functional [Chrome 16]
        if (keyCode === 13 || keyCode === 9){
            this._onSave();
            return false;
        }
        // ESc - to exit editing or creating a task
        else if (keyCode === 27){
            this.cancelEdit(this.activeTask);
            return false;
        }
    },
    
    _onCreate: function(){
        // Create a new task; if there is an unsaved task then save it first
        if (!this.activeTask || this.getTaskView(this.activeTask).hasUnsavedDescription()){
            this.createTask();
        }
        // If there is already a task being edited, and no content has been added, then toggle off editing
        else {
            this.cancelEdit(this.activeTask);
        }
        return false;
    },
    
    /////
    
    // TITLE HANDLERS

    // a click on the item title will find the edit icon & fire that control
    _onTaskEditClick: function(event) {
        var target = event.target;
    
        if (target.nodeName.toUpperCase() == "P") {
            // re-assign the click target to be the edit icon
            event.target = jQuery(target).parents("li").find("li.edit a")[0];
            this._onControlAction(event);
        };
        return this;
    },

    // click the hub title to envoke the title edit
    _onTitleEditClick: function(event){
        return this._onTitleEdit(event);
    },

    _onTitleMouseover: function (event) {
        this.$("div.header").addClass("hover");
        return false;
    },

    _onTitleMouseout: function (event) {
        this.$("div.header").removeClass("hover");
        return false;
    },
    
    /////
    
    // CONTROL BUTTON HANDLERS

    /*
    * Handles all action events delegated to the .item-list element on initialisation.
    * Looks at the event target parent element and calls a view method to process that action.
    */
    _onControlAction: function (event) {
        var el = event.target,
            cid = this.getCidFromElement(el),
            parentClass = el.parentNode.className,
            action = parentClass && parentClass.split(" ")[0],
            // find the appropriate view method - e.g. _onDelete
            methodName = action && "_on" + action[0].toUpperCase() + action.slice(1);
        
        if (methodName && this[methodName]) {
            this[methodName](cid, el);
        }
        else {
            throw "taskListView._onControlAction: " + methodName + " not found";
        }
        return false;
    },

    _onEdit: function (cid) {
        this.editTask(this.collection.getByCid(cid));
    },
    
    _onDelete: function (cid) {
        this.deleteTask(this.collection.getByCid(cid));
    },
    
    _onTick: function (cid) {
        var currentUserId = app.currentUser.id,
            task = this.collection.getByCid(cid),
            forceMode = true,
            state = task.get("state"),
            newState = state === Task.states.VERIFIED || state ===  Task.states.DONE ?
                Task.states.NEW : Task.states.DONE;

        task.state(newState, currentUserId, forceMode)
            .save();
    },

    _onStar: function (cid) {
        var task = this.collection.getByCid(cid);
        
        if (task.get("starred.id")){
            task.unstar();
        }
        else {
            task.star();
        }
    }
});
