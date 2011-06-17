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
                hub   = Tasket.getHubs(1);

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
                taskListView.bind("add-item", function (itemText) {
                    var newTask = new Task({
                        description: itemText,
                        owner: "1", //TODO: update the 3 lines below
                        hub: hub.id, //
                        estimate: Tasket.settings.TASK_ESTIMATE_MAX //
                    });

                    Tasket.tasks.add(newTask);
                    newTask.save();

                }).bind("update-item", function (cid, attrValues) {
                    var task = Tasket.tasks.getByCid(cid);
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
