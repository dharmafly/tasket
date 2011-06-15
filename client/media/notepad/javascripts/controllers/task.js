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

    showTasks: function () {
      if (!this.taskViewRendered) {
        var controller = this,
            hub = Tasket.getHubs(1),
            taskListView;

        hub.bind("change", function () {
            taskListView = new TaskListView({model: hub});
            $('#main aside').after(taskListView.render());
            controller.taskViewRendered = true;
        });
      }
    },

    newTask: function () {
    }

});
