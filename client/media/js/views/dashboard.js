var Dashboard = View.extend({
    tagName: 'section',
    className: 'dashboard',
    render: function () {
        var rendered = tim('dashboard');
        this.elem.html(rendered);

        // Update each of the task lists.
        _.each(['MyTasks', 'MyHubs', 'ManagedTasks'], function (method) {
            this['update' + method]();
        }, this);

        return this;
    },
    updateManagedTasks: function () {
        this.updateList('.managed-tasks ul', this.model.tasks.owned);
    },
    updateMyTasks: function () {
        this.updateList('.my-tasks ul', this.model.tasks.claimed);
    },
    updateMyHubs: function () {
        this.updateList('.my-projects ul', this.model.hubs.owned);
    },
    updateList: function(selector, models){
        var mapped = models.map(function (model) {
            return {
                href: '#/' + model.id,
                title: model.get('title')
            };
        });

        this.$(selector).html(tim('dashboard-link', {
           links: mapped
        }));
        return this;
    }
});

