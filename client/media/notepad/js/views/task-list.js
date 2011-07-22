var TaskListView = View.extend({
    el: jQuery("section#content"),
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
        "click div.header a.cancel": "_onTitleEditCancel",
        "click div.header a.save": "_onTitleEditSave",
        "mouseover div.header h1 a": "_onTitleMouseover",
        "mouseout div.header h1 a": "_onTitleMouseout",
        "keypress div.header input": "_onKeypressTitle",
        "click a.new-item": "_onNewItemClick"
    },

   /*
    * Display object name in browser console.
    *
    *
    */
    constructor: function TaskListView () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        var view = this;

        this.elem = jQuery(this.el);
        _.bindAll(this,
            "_onControlAction",
            "_onCancel",
            "_onKeypress",
            "_onSave",
            "_onSort"
        );


        this.model.bind("change:title", function (task) {
            view._resetTitle(task.get("title"));
        });

        this.collection
            // display the action controls once a hub task is saved
            .bind("change:id", function (task, collection) {
                var taskView = view.taskViews[task.cid];

                if (task.get("hub") == view.model.id) {
                    taskView.showActionControls();
                }

            // Append new items to the list
            }).bind("add", function (task, collection) {
               var taskView;

               if (task.get("hub") == view.model.id) {
                    view.renderTasks(task);
               }
            });

        //delegate all item action events to the ul.item-list element.
        this.elem
            .delegate(".item-list ul.edit-item li a", "click", view._onControlAction)
            .delegate("li p a.cancel", "click", view._onCancel)
            .delegate("li p a.save", "click", view._onSave)
            .delegate("li p input", "keypress", view._onKeypress);

    },

    /*
    * Renders the view.
    *
    * Returns the view's element.
    *
    */
    render: function () {
        var hub = this.model,
            listTitle = hub.get('title'),
            view = this;

        this.elem.html(tim('task-list', {listTitle: listTitle}));
        this.itemList = this.$("ul.item-list");
        this.makeSortable();

        return this;
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
        var hub = this.model,
            tasks = this.collection,
            ids = jQuery.map(this.itemList.children(), function (item) {
                var cid = item.getAttribute("data-cid"),
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
    *
    * tasks - a single or an array of task model instances.
    *
    * Returns nothing.
    *
    */
    renderTasks: function (tasks) {
        var view = this,
            itemList = this.itemList,
            taskView;

        tasks = tasks instanceof TaskList ? tasks.toArray() : [tasks];
        tasks = this._orderTasks(tasks);

        _.each(tasks, function (task) {
            taskView = new TaskView({model: task, collection: view.collection});
            view.taskViews[task.cid] = taskView;
            itemList.append(taskView.render().el);

            //new item
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
                return aTask.id == id;
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

    _onTitleEdit: function (event) {
        var listTitle = this.previousTitle =  this.$("div.header h1 a").text(),
            html = jQuery(tim("title-edit", {placeholder: false}));

        this.$("div.header").addClass("edit-mode");
        this.$("div.header h1").replaceWith(html);
        this.$("div.header input").val(listTitle).focus();
        event.preventDefault();
    },

    _onTitleEditSave: function (event) {
        var newTitle = this.$("div.header input").val();

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
        this.$("div.header").removeClass("edit-mode");        
    },

    _onKeypressTitle: function (event) {
        var newTitle = jQuery(event.target).val();

        if (_.isEmpty(newTitle)) {
            newTitle = app.lang.EMPTY_HUB;
        }

        // Return and tab keys
        if (_.include([13, 9], event.which)) {
            this._saveTitle(newTitle);
        }
    },

    _resetTitle: function (title) {
        if (_.isEmpty(title)) {
            title = app.lang.EMPTY_HUB;
        }

        this.$("div.header input").replaceWith(
            jQuery('<h1><a href="#">'+title+'</a></h1>')
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
    *
    * Returns the taskView instance associated to an event target element.
    *
    * element - An event target element.
    *
    * returns an instance of TaskView.
    *
    *
    */
    _getElementView: function (element) {
        var li = jQuery(element).parents("li[data-cid]");
        return this.taskViews[ jQuery(li).attr("data-cid") ];
    },


    /*
    * Handles the click event fired by the new item link
    *
    * event - An event object.
    *
    * Returns nothing.
    *
    */
    _onNewItemClick: function (event) {

        // allow only one unsaved item at the time
        if (this.newTaskView) {
          return false;
        }

        // If an item is being edited, reset it.
        if (this.editedTaskView) {
          this.editedTaskView.reset();
          this.editedTaskView = null;
        }

        var newTask = new Task({
            hub: app.selectedHub.id,
            owner: app.currentUser.id,
            estimate: Tasket.settings.TASK_ESTIMATE_MAX
        });
        this.collection.add(newTask);
        event.preventDefault();
    },

    /*
    * Handles all action events delegated to the .item-list element on initialisation.
    * Looks at the event target parent element and calls a view method to process that action.
    *
    * event - An event object.
    *
    * Returns nothing.
    *
    */
    _onControlAction: function (event) {
        var modelCid = jQuery(event.target).parents("li[data-cid]").data("cid"),
            action = _.first( jQuery(event.target).parent().attr("className").split(' '));

        event.preventDefault();

        if ("_on" + action in this) {
            this["_on"+action](modelCid, event.target);
        } else {
          throw "_on" + action + " method does not exist";
        }
    },

   /**
    * Handles the 'delete' action.
    * Triggers the 'remove-item' event and passes along the cid of the selected task.
    *
    * cid    - The cid of a Task instance.
    * target - The event target element (optional).
    *
    * returns nothing.
    */
    _ondelete: function (cid, target) {
        var taskView = this.taskViews[cid];
        taskView.remove();
        this.trigger("remove-item", taskView.model);
    },

   /**
    * Handles the 'edit' action.
    *
    * cid - The cid of a Task instance.
    *
    * target - The event target element.
    * returns nothing.
    */
    _onedit: function (cid, target) {
        var taskView = this.taskViews[cid];

        // cancel all active edits
        this.$("a.cancel").click();

        if (this.editedTaskView && taskViews == this.editedTaskVew ) {
            // Do nothing if the user is already editing this same task.
            return false;
        }

        this.editedTaskVew = taskView;
        taskView.makeEditable();
    },


   /*
    * Handles the _ontick action and triggers the 'update-item' event passing along 'state:"done"' and 'claimedBy:<currentUserId>' as update values.
    *
    *
    * Returns nothing.
    */
    _ontick: function (cid, target) {
        var currentUserId = app.currentUser.id,
            task = this.collection.getByCid(cid),
            forceMode = true,
            newState = _.include(
                [Task.states.VERIFIED, Task.states.DONE ], task.get("state")
            ) ? Task.states.NEW : Task.states.DONE ;

        task.state(newState, currentUserId, forceMode)
            .save();

    },

   /*
    * Handles the _onstar action and triggers the 'update-item' event passing along 'starred:!starred' as update values.
    *
    * Returns nothing.
    */

    _onstar: function (cid, target) {
        var task = this.collection.getByCid(cid),
            starred = !task.get("starred");

        this.trigger("update-item", task, {
            starred: starred
        });
    },

    /*
    * Handles the cancel edit event.
    *
    * event - An event object.
    *
    * returns nothing.
    *
    */

    _onCancel: function (event) {
        var taskView = this._getElementView(event.target),
            view = this;

        this.newTaskView = null;

        if (taskView.model.isNew()) {
          taskView.remove();
        }
        else {
          taskView.reset();
        }

        this.editedTaskView = null;
        event.preventDefault();

    },

    /*
    * Handles the onChange event on the editing input field.
    *
    * event - An event object.
    *
    *
    * Returns nothing.
    */

    _onKeypress: function (event) {
        var description, taskView;

        if (_.include([9,13], event.which)) {
            description = jQuery(event.target).val();
            taskView = this._getElementView(event.target);

            this._saveNewItem(taskView.model, description, event.target);
        }
    },

    _onSave: function (event) {
        var taskView = this._getElementView(event.target),
            description = taskView.$("input").val();

        this._saveNewItem(taskView.model, description, event.target);
        event.preventDefault();
    },

    /*
    * Triggers the "update-item" event and expands a new insert item input if the task is new.
    *
    * task        - An instance of the Task model.
    * description - The todo item description.
    *
    *
    * Returns nothing.
    *
    */

    _saveNewItem: function (task, description) {
        var view = this;
        view.newTaskView = null;
        if (task.isNew()) {
          view.$("a.new-item").click();
        }
        view.trigger('update-item', task, {description: description});
    }

});
