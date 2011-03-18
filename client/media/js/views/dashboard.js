var Dashboard = View.extend({
    tagName: 'section',
    className: 'dashboard',
    render: function () {
        var rendered = tim('dashboard');
        this.elem.html(rendered);

        // Update each of the task lists.
        _.each(['UserTasks', 'UserHubs', 'ManagedTasks'], function (method) {
            this['update' + method]();
        }, this);

        return this;
    },
    updateManagedTasks: function () {
        var tasks = Tasket.tasks.filterByIds(this.model.get('tasks').owned);
        return this.updateList('.managed-tasks ul', tasks);
    },
    updateUserTasks: function () {
        var tasks = Tasket.tasks.filterByIds(this.model.get('tasks').claimed);
        return this.updateList('.my-tasks ul', tasks);
    },
    updateUserHubs: function () {
        var hubs = Tasket.hubs.filterByIds(this.model.get('hubs').owned);
        return this.updateList('.my-projects ul', hubs);
    },
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

