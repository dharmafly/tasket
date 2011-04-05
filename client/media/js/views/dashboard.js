var Dashboard = View.extend({
    tagName: "section",

    className: "dashboard",

    classes: {
        detailShown: "detail-active"
    },

    constructor: function Dashboard() {
        View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
        View.prototype.initialize.apply(this, arguments);

        _.bindAll(this,
            "updateNotifications",
            "updateUserTasks",
            "updateUserHubs",
            "updateManagedTasks"
        );

        // Setup the user bindings.
        this.setUser(this.model);

        // Set up the detail instance.
        this.detail = new DashboardDetail();
        this.detail.bind("all", _.bind(function (event) {
            if (event === "show") {
                this.elem.addClass(this.classes.detailShown);
            }
            else if (event === "hide") {
                this.elem.removeClass(this.classes.detailShown);
            }
        }, this));
    },

    // Sets up bindings to update the dashbaord when the user changes.
    setUser: function (user, options) {
        var dashboard = this,
            methodMap;

        methodMap = {
            "UserHubs":      ["hubs.owned"],
            "UserTasks":     ["tasks.claimed.claimed"],
            "ManagedTasks":  ["tasks.owned.done"],
            "Notifications": [
              "tasks.owned.claimed", "tasks.owned.done", "tasks.claimed.verified"
            ]
        };

        // Update the user object if nessecary.
        this.model = arguments.length ? user : this.model;

        if (this.model) {
            this.model.bind("change", function (user) {
                _.each(methodMap, function (attributes, method) {
                    // For each of the attributes in the methodMap see if it has
                    // changed if so call the associated method.
                    _.each(attributes, function (attribute) {
                        if (user.hasChanged(attribute)) {
                            dashboard["update" + method]();
                        }
                    });
                });
            });

            if (!options || options.silent !== true) {
                this.render();
            }
        }

        return this;
    },

    render: function () {
        var rendered = tim("dashboard");
        this.elem.html(rendered);

        // Update each of the task lists.
        _.each(["Notifications", "UserTasks", "UserHubs", "ManagedTasks"], function (method) {
            this["update" + method]();
        }, this);

        this.elem.append(this.detail.hide().render().el);

        return this;
    },

    userStatistics: function(){
        var user = this.model;
        return {
            ownedClaimed:    user.get("tasks.owned.claimed").length,
            adminedDone:     user.get("tasks.owned.done").length,      // TODO: if an admin, this should include all done tasks
            claimedVerified: user.get("tasks.claimed.verified").length // TODO: should be recent verified tasks
        };
    },

    // Updates the user status box.
    updateNotifications: function () {
        var stats = this.model && this.model.get("statistics"),
            notifications = this.$(".notifications");

        if (stats) {
            notifications.show();
            notifications.find("a").each(function () {
                var anchor = jQuery(this),
                    listItem = anchor.parent(),
                    type = this.getAttribute("data-type"),
                    elem = anchor.find("span");

                if (stats[type]) {
                    elem.text(stats[type]);
                    listItem.show();
                }
                else {
                    listItem.hide();
                }
            });
        } else {
            notifications.hide();
        }
    },

    // Updates the "Tasks I Manage" box.
    updateManagedTasks: function () {
        var tasks = null;
        if (this.model) {
            tasks = Tasket.getTasks(this.model.get("tasks.owned.done"));
            tasks.bind("refresh", this.updateManagedTasks);
        }
        return this.updateList(".managed-tasks", tasks);
    },

    // Updates the "My Tasks" box.
    updateUserTasks: function () {
        var tasks = null;
        if (this.model) {
            tasks = Tasket.getTasks(this.model.get("tasks.claimed.claimed"));
            tasks.bind("refresh", this.updateUserTasks);
        }
        return this.updateList(".my-tasks", tasks);
    },

    // Updates the "My Projects" box.
    updateUserHubs: function () {
        var hubs = null;
        if (this.model) {
            hubs = Tasket.getHubs(this.model.get("hubs.owned"));
            hubs.bind("refresh", this.updateUserHubs);
        }
        return this.updateList(".my-projects", hubs);
    },

    // Updates a list of tasks/hubs based on the selector & collection.
    updateList: function(selector, models){
        var mapped;

        if (models && (models.length || models.type === "hub")) {
            mapped = models.map(function (model) {
                var title = model.get("title") || model.get("description");
                return {
                    href:        "#/" + model.type + "s/" + model.id,
                    title:       truncate(title, 15),
                    isHub:       model.type === "hub",
                    isTask:      model.type === "task",
                    showDone:    app.isCurrentUser(model.get("claimedBy")),
                    showVerify: !app.isCurrentUser(model.get("claimedBy"))
                };
            });
            this.$(selector).show().find("ul").html(tim("dashboard-link", {
                links: mapped
            }));
        } else {
            this.$(selector).hide();
        }

        return this;
    }
});
