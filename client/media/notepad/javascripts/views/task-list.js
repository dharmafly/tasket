var TaskListView = View.extend({
    tagName: 'section',
    id: 'content',
    /* collection of taskView instances, organised by task.cid => taskView  */
    taskViews: {},
    events: {
        'click a.new-item': '_onNewItemClick'
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

        this.taskView = new TaskView({model: new Task({
            hub: notepad.selectedHub.id,
            owner: notepad.currentUser.id
        })});

        this.elem = jQuery(this.el);
        _.bindAll(this,"_onControlAction", "_onCancel", "_onKeypress");

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
            .delegate("ul.edit-item li a", "click", view._onControlAction)
            .delegate("li p a.cancel", "click", view._onCancel)
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
            taskView = this.taskView;

        return this.elem.html(tim('task-list', {listTitle: listTitle}))[0];
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

        tasks = tasks instanceof TaskList ? tasks : new TaskList(tasks);

        tasks.each(function (task) {
            taskView = new TaskView({model: task, collection: view.collection});
            view.taskViews[task.cid] = taskView;
            view.$('.item-list').append(taskView.render());


            if (task.isNew()) {
                taskView.makeEditable();
            }
        });
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
            hub: notepad.selectedHub.id,
            owner: notepad.currentUser.id,
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
        this.trigger("remove-item", cid);
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
        var currentUserId = "1",
            task = this.collection.getByCid(cid),
            forceMode = true;

        task.state(Task.states.DONE, currentUserId, forceMode)
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

        this.trigger("update-item", cid, {
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
        console.info('onCancel!');
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

        if (_.include([0,13], event.which)) {
            description = jQuery(event.target).val();
            taskView = this._getElementView(event.target);

            this.trigger('update-item', taskView.model, {description: description});
        }
    }
});
