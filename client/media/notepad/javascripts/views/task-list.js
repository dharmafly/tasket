var TaskListView = View.extend({
    tagName: 'section',
    id: 'content',
    taskFormView: null,
    /* collection of taskView instances, organised as {id: x, instance: ...}*/
    taskViews: [],
    events: {
        'click a.new-item': '_onNewItemClick'
    },

   /*
    * Display object name in browser console.
    *
    *
    */
    constructor: function () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        var view = this;
        this.taskFormView = new TaskFormView();
        this.model = options.model;


        //forward sub-view event to the controller
        this.taskFormView.bind("add-item", function forwardEvent(itemText) {
            view.trigger("add-item", itemText);
        });
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
            taskFormView = this.taskFormView;

        $(this.el).html(tim('task-list', {listTitle: listTitle}));
        this.$('.new-item').after(taskFormView.render());
        $(taskFormView.el).hide();

        O('RENDERING LIST');
        return this.el;
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

        O(tasks);
        tasks.each(function (task) {
            taskView = new TaskView({model: task});
            view.taskViews.push({id: task.id, instance: task});
            view.$('.item-list').append(taskView.render());
        });
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
        this.$('a.new-item').hide();
        $(this.taskFormView.el).show();
    }

});
