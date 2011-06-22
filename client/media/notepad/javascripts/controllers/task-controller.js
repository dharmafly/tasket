var TaskController = Backbone.Controller.extend({
    routes: {
    },

    taskViewRendered: false,

   /*
    * Display object name in webkit console.
    *
    *
    */
    constructor: function () {
        var controller = this;
        Backbone.Controller.prototype.constructor.apply(this, arguments);
        app.bind("change:selectedHub", function () {
            if (!this.taskListView) {
                controller.showTaskList();
            }
        });
    },

    showTaskList: function () {
        var controller = this,
            hub = app.selectedHub,
            currentUser = app.currentUser,
            tasks = Tasket.getTasks(hub.get("tasks.new")),
            taskListView = this.taskListView = new TaskListView({model: hub, collection: Tasket.tasks});


        jQuery('#main aside').after(taskListView.render());

        //event handler for passing loaded tasks to the view
        tasks.bind("refresh", function () {
            taskListView.renderTasks(tasks);
        });

        //event handler for saving new items
        taskListView.bind("update-item", function (task, attrValues) {

            //never accept an empty description
            if (_.isEmpty(attrValues.description)) {
                attrValues.description = app.lang.EMPTY_TASK;
            }

            task.set(attrValues);
            task.save();

        }).bind("remove-item", function (cid) {
            var task = Tasket.tasks.getByCid(cid);
            task.destroy();
        });

    }




});
