var TaskListView = View.extend({
    tagName: 'section',
    id: 'content',
    taskFormView: null,
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
    constructor: function () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        var view = this;
        this.taskFormView = new TaskFormView();
        this.elem = jQuery(this.el);
        _.bindAll(this,"_onControlAction");

        //forward sub-view event to the controller
        this.taskFormView.bind("add-item", function forwardEvent(itemText) {
            view.trigger("add-item", itemText);
        });

        //delegate all item action events to the ul.item-list element.
        this.elem.delegate("ul.edit-item li a", "click", view._onControlAction);
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

        this.elem.html(tim('task-list', {listTitle: listTitle}));
        this.$('.new-item').after(taskFormView.render());
        jQuery(taskFormView.el).hide();

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

        tasks.each(function (task) {
            taskView = new TaskView({model: task});
            view.taskViews[task.cid] = taskView;
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
        jQuery(this.taskFormView.el).show();
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
            this["_on"+action](modelCid);
        }
    },

   /**
    * Processes the 'delete' action.
    * Triggers the 'remove-item' event and passes along the cid of the selected task.
    *
    * cid - The cid of a Task instance.
    *
    * returns nothing.
    */
    _ondelete: function (cid) {
        this.trigger("remove-item", cid);
    }

});
