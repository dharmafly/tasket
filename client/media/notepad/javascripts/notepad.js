var notepad = _.extend({
        setup: function () {
        },


        bootstrap: function () {
            var taskController = new TaskController();

            Backbone.history.start();
        }

    }, app);

