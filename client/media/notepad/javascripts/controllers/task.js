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
                hub   = Tasket.getHubs(1),
                taskListView,
                tasks,
                newTask;

            hub.bind("change", function () {
                taskListView = new TaskListView({model: hub});
                tasks = Tasket.getTasks(hub.get("tasks.new"));


                //event handler for passing loaded tasks to the view
                tasks.bind("refresh", function () {
                    taskListView.renderTasks(tasks);
                });

                //event handler for creating new items
                taskListView.bind("add-item", function (itemText) {
                    newTask = new Task({
                        description: itemText,
                        owner: 1, //TODO: update the 3 lines below
                        hub: hub.id, //
                        estimate: Tasket.settings.TASK_ESTIMATE_MAX //
                    });

                    taskListView.renderTasks(newTask);
                    newTask.save();
                });
                taskListView.bind("remove-item", function (cid) {
                    O('removing item');
                    var task = Tasket.tasks.getByCid(cid);
                    task.destroy();
                });



            Tasket.tasks.bind("change:id", function(collection, task){
                if (task.get("hub") === app.selectedHub){
                    // remove "unsaved" className from view
                }
            });

            $('#main aside').after(taskListView.render());
            controller.taskViewRendered = true;
        });
      }
    },

    newTask: function () {
    }

});
