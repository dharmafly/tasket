var TaskListView = View.extend({
    tagName: 'section',
    id: 'content',
    taskFormView: null,
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
      this.model = options.model;
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
            taskFormView = this.taskFormView = new TaskFormView();

        $(this.el).html(tim('task-list', {listTitle: listTitle}));
        this.$('.new-item').after(taskFormView.render());
        $(taskFormView.el).hide();

        return this.el;
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
