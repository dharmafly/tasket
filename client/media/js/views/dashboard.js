var Dashboard = View.extend({
    tagName: 'section',

    className: 'dashboard',

    constructor: function Dashboard() {
        View.prototype.constructor.apply(this, arguments);
    },

    render: function () {
        var rendered = tim('dashboard');
        this.elem.html(rendered);

        // Update each of the task lists.
        _.each(['Notifications', 'UserTasks', 'UserHubs', 'ManagedTasks'], function (method) {
            this['update' + method]();
        }, this);

        return this;
    },

    // Updates the user status box.
    updateNotifications: function () {
        var stats = this.model.get('statistics'),
            notifications = this.$('.notifications');

        if (stats) {
            notifications.show();
            notifications.find('a').each(function () {
                var type = this.getAttribute('data-type');
                if (stats[type]) {
                    $(this).find('span').text(stats[type]);
                }
            });
        } else {
            notifications.hide();
        }
    },

    // Updates the "Tasks I Manage" box.
    updateManagedTasks: function () {
        var tasks = Tasket.tasks.filterByIds(this.model.get('tasks').owned);
        return this.updateList('.managed-tasks ul', tasks);
    },

    // Updates the "My Tasks" box.
    updateUserTasks: function () {
        var tasks = Tasket.tasks.filterByIds(this.model.get('tasks').claimed);
        return this.updateList('.my-tasks ul', tasks);
    },

    // Updates the "My Projects" box.
    updateUserHubs: function () {
        var hubs = Tasket.hubs.filterByIds(this.model.get('hubs').owned);
        return this.updateList('.my-projects ul', hubs);
    },

    // Updates a list of tasks/hubs based on the selector & collection.
    updateList: function(selector, models){
        var mapped = models.map(function (model) {
            return {
                href: '#/' + model.type + '/' + model.id,
                title: model.get('title') || 'Missing title'
            };
        });

        this.$(selector).html(tim('dashboard-link', {
           links: mapped
        }));
        return this;
    }
});

