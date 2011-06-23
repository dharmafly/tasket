var TaskListView = View.extend({
    el: jQuery("section#content"),
    // collection of taskView instances, organised by task.cid => taskView  
    taskViews: {},

    // caches the hub title so it can be restored when cancelling an edit.

    previousTitle: null,
    events: {
        "click header .edit a": "_onTitleEdit",
        "click header a.cancel": "_onTitleEditCancel",
        "click header a.save": "_onTitleEditSave",
        "mouseover header h1 a": "_onTitleMouseover",
        "mouseout header h1 a": "_onTitleMouseout",
        "keypress header input": "_onKeypressTitle",
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
            taskView;

        tasks = tasks instanceof TaskList ? tasks.toArray() : [tasks];
        tasks = this._orderTasks(tasks);

        _.each(tasks, function (task) {
            taskView = new TaskView({model: task, collection: view.collection});
            view.taskViews[task.cid] = taskView;
            view.$('.item-list').append(taskView.render().el);

            //new item
            if (task.isNew()) {
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
        var listTitle = this.previousTitle =  this.$("header h1 a").text(),
            html = jQuery(tim("task-edit" ,{placeholder: false}));

        this.$("header h1").replaceWith(html);
        this.$("header input").val(listTitle).focus();
        event.preventDefault();
    },

    _onTitleEditSave: function (event) {
        var newTitle = this.$("header input").val();

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
    },

    _onKeypressTitle: function (event) {
        var newTitle = jQuery(event.target).val();

        if (_.isEmpty(newTitle)) {
            newTitle = app.lang.EMPTY_HUB;
        }

        if (_.include([13, 9], event.which)) {
            this._saveTitle(newTitle);
        }
    },

    _resetTitle: function (title) {
        if (_.isEmpty(title)) {
            title = app.lang.EMPTY_HUB;
        }

        this.$("header input").replaceWith(
            jQuery('<h1><a href="#">'+title+'</a></h1>')
        );
        this.$("header .cancel, header .save").remove();
    },

    _onTitleMouseover: function (event) {
        this.$("header").addClass("hover");
        event.preventDefault();
    },

    _onTitleMouseout: function (event) {
        this.$("header").removeClass("hover");
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
        this.trigger("remove-item", taskView.model);
    },

   /**
    * Handles the 'edit' action.
    * Triggers the 'update-item' event and passes along the cid of the selected task.
    *
    * cid - The cid of a Task instance.
    *
    * target - The event target element.
    * returns nothing.
    */
    _onedit: function (cid, target) {
        var taskView = this.taskViews[cid];
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
            newState = _.include([Task.states.VERIFIED,
                                 Task.states.DONE ], task.get("state")) ?
              Task.states.NEW :
              Task.states.DONE ;

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
        var taskView = this._getElementView(event.target);
        taskView.reset();
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

            this.trigger('update-item', taskView.model, {description: description});
        }
    },

    _onSave: function (event) {
        var taskView = this._getElementView(event.target),
            description = taskView.$("input").val();

        this.trigger('update-item', taskView.model, {description: description});

        event.preventDefault();
    }
});
