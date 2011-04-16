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
            "updateManagedTasks",
            "updateStatistics"
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

        app.bind("change:statistics", this.updateStatistics);
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
        this.elem.html(tim("dashboard", {
            verified: app.statistics.tasks.verified
        }));

        // Update each of the task lists.
        _.each(["Notifications", "UserTasks", "UserHubs", "ManagedTasks"], function (method) {
            this["update" + method]();
        }, this);

        this.elem.append(this.detail.hide({silent: true}).render().el);

        return this;
    },
    
    getHubAnchorById: function(hubId){
        var hubAnchor;
    
        this.$("section.quicklinks.my-projects ul.listing li a").each(function(){
            var match = this.href.match(HubView.hubIdInUrlRegex),
                anchorHubId = match && match[1];
                
            if (hubId === anchorHubId){
                hubAnchor = this;
                return true;
            }
        });
    
        return hubAnchor;
    },
    
    hubAnchorsDeselect: function(){
        this.$("section.quicklinks.my-projects ul.listing li").removeClass("select");
        return this;
    },
    
    hubAnchorSelect: function(){
        var hubAnchor = this.getHubAnchorById(app.selectedHub);
        
        if (hubAnchor){
            this.hubAnchorsDeselect();
            jQuery(hubAnchor).parent().addClass("select");
        }
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

    updateStatistics: function () {
        this.$('.statistics em').text(app.statistics.tasks.verified);
    },

    // Updates the user status box.
    updateNotifications: function () {
        var stats = this.model && this.userStatistics(),
            notifications = this.$(".notifications"),
            items = notifications.children("li"),
            visible;

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

            // Remove margin from the last item.
            items.removeClass("last");
            visible = items.filter(":visible");
        }

        if (visible && visible.length) {
            visible.last().addClass("last");
        } else {
            notifications.hide();
        }
    },

    // Updates the "Tasks I Manage" box.
    updateManagedTasks: function () {
        var tasks = null;
        if (this.model) {
            tasks = this._getCollection("getTasks", "tasks.owned.done", this.updateManagedTasks);
        }
        return this.updateList(".managed-tasks", tasks);
    },

    // Updates the "My Tasks" box.
    updateUserTasks: function () {
        var tasks = null;
        if (this.model) {
            tasks = this._getCollection("getTasks", "tasks.claimed.claimed", this.updateUserTasks);
        }
        return this.updateList(".my-tasks", tasks);
    },

    // Updates the "My Projects" box.
    updateUserHubs: function () {
        var hubs = null;
        if (this.model) {
            hubs = this._getCollection("getHubs", "hubs.owned", this.updateUserHubs);
        }
        return this.updateList(".my-projects", hubs).hubAnchorSelect();
    },

    // Updates a list of tasks/hubs based on the selector & collection.
    updateList: function(selector, models){
        var mapped;
        if (models && (models.length || models.type === "hub")) {
            mapped = models.map(function (model) {
                var title = model.get("title") || model.get("description");
                return {
                    id:          model.id,
                    href:        "#/" + model.type + "s/" + model.id + "/",
                    title:       app.truncate(title, 15),
                    isHub:       model.type === "hub",
                    isTask:      model.type === "task",
                    showDone:    app.isCurrentUser(model.get("claimedBy")) && model.get("state") === Task.states.CLAIMED,
                    showVerify:  app.isCurrentUser(model.get("owner")) && model.get("state") === Task.states.DONE 
                };
            });
            this.$(selector).show().find("ul").html(tim("dashboard-link", {
                links: mapped
            }));
        } else {
            this.$(selector).hide();
        }

        return this;
    },

    // Retrieves a collection of models from a Tasket cache.
    // method   - the Tasket getter for the models eg. "getTasks"
    // key      - the Model attribute containing the ids to fetch
    // callback - a function to call when the collection or models change
    _getCollection: function (method, key, callback) {
        var collection = Tasket[method](this.model.get(key));
        collection.bind("refresh", callback);

        // Currently only display the title/description so only re-render
        // if this changes.
        collection.invoke("bind", "change", function (model) {
            var watch = ["owner", "title", "description"];
            do {
                if (model.hasChanged(watch.pop())) {
                    callback();
                    break;
                }
            } while (watch.length);
        });
        return collection;
    }
});
