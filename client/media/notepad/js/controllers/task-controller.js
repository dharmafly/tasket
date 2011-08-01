var TaskController = Backbone.Controller.extend({
    routes: {
    },

    taskViewRendered: false,

   /*
    * Display object name in webkit console.
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
            tasks = Tasket.getTasks(hub.get("tasks.new").concat(hub.get("tasks.claimed"))),
            taskListView = this.taskListView = new TaskListView({
                model: hub,
                collection: Tasket.tasks
            });
        
        // Render the list view. Because the view has an id of "content", it will replace the existing #content element
        taskListView.render();

        //event handler for rendering loaded tasks into the view
        tasks.bind("refresh", function () {
            taskListView.renderTasks(tasks);
        });

        //event handler for saving new items
        taskListView
            .bind("update-item", function (task, attrValues) {
                // Set a default description
                if ("description" in attrValues && _.isEmpty(attrValues.description)) {
                    attrValues.description = app.lang.EMPTY_TASK;
                }
                task.save(attrValues);
            })
            .bind("remove-item", function (task) {
                task.destroy();
            });
    }
});
