var TaskController = Backbone.Controller.extend({
    routes: {
        '/': 'showTasks',
        '/tasks/new': 'newTask'
    },

    taskViewRendered: false,

   /*
    * Display object name in webkit console.
    *
    *
    */
    constructor: function () {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
        this.showTasks();
    },


    /*
    * Public: Shows the tasks in a list
    *
    *
    *
    *
    *
    */

    showTasks: function () {
        if (!this.taskViewRendered) {
            var controller = this,
                // TODO TEMP
                hub = app.selectedHub = Tasket.getHubs(1),
                currentUser = app.currentUser;

            hub.bind("change", function () {
                var tasks, taskListView;

                //do not execute the following code block if taskListView has already rendered.
                if (controller.taskViewRendered) {
                    return;
                }

                tasks = Tasket.getTasks(hub.get("tasks.new"));
                taskListView = new TaskListView({model: hub, collection: Tasket.tasks});

                $('#main aside').after(taskListView.render());
                controller.taskViewRendered = true;

                //event handler for passing loaded tasks to the view
                tasks.bind("refresh", function () {
                    taskListView.renderTasks(tasks);
                });

                //event handler for saving new items
                taskListView.bind("update-item", function (task, attrValues) {
                    task.set(attrValues);
                    task.save();

                }).bind("remove-item", function (cid) {
                    var task = Tasket.tasks.getByCid(cid);
                    task.destroy();

                });
        });
      }
    },

    newTask: function () {
    }

});
