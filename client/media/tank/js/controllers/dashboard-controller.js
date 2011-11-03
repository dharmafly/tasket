var DashboardController = Backbone.Router.extend({
    routes: {
        "/dashboard/user/:id": "showUser",
        "/dashboard/tasks/":   "showCurrentUserTasks",
        "/dashboard/hubs/":    "showCurrentUserHubs"
    },

    constructor: function DashboardController() {
        Backbone.Router.apply(this, arguments);
    },

    showCurrentUserTasks: function () {
        var user = app.currentUser;
    },

    showCurrentUserHubs: function () {
        var user = app.currentUser;
        app.dashboard.detail.title(app.lang.MY_HUBS).show();
    }
});
