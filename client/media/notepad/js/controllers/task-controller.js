var TaskController = Controller.extend({
    routes: {
        "/": "showLatestOrNew",
        "/hubs/new": "newHub",
        "/hubs/starred": "showStarred",
        "/hubs/:hub": "showHub"
    },

    taskViewRendered: false,

   /*
    * Display object name in webkit console.
    */
    constructor: function () {
        var controller = this;

        Controller.apply(this, arguments);

        // Set up views on login.
        app.bind("change:currentUser", _.once(function (user) {
            jQuery("body").addClass("loggedin");
            controller.createHubList();
            controller.createTaskList();
        }))
        
        .bind("change:selectedHub", function (hub, opts) {
            opts = opts || {};
            
            if ("showTasksOfType" in opts) {
                app.cache.set("showTasksOfType", opts.showTasksOfType);
            }
            else{
                opts.showTasksOfType = app.cache.get("showTasksOfType") ? app.cache.get("showTasksOfType") : "onlyIncomplete";
            }
            
            if (app.currentUser) {
                controller.navigate(hub.url());
                controller.hubListView.selectHub(hub);
                controller.taskListView.showHub(hub, opts);
            };
        });
        
        // keyboard shortcuts
        app.bodyElem
            .bind("keyup", function(e){
                var keyCode = e.keyCode ? e.keyCode : e.which,
                    taskListView;
                
                if (app.currentUser && controller.taskListView) {
                    taskListView = controller.taskListView;
                
                    switch(keyCode){
                        case 78:
                            // "n" for new task
                            if (!(taskListView.newTaskView || taskListView.editedTaskView)) {
                                taskListView.createTask();
                                e.preventDefault();
                            };
                            break;

                        case 27:
                            // escape out of editing/creating a task
                            if (taskListView.newTaskView || taskListView.editedTaskView) {
                                taskListView.cancelEdit();
                                e.preventDefault();
                            };
                            break;
                    }
                }
            })
            // Cancel the edit of a task, if the user clicks off an edited task
            .bind("click", function(e){
                var taskListView = controller.taskListView,
                    taskView, taskElem;
                    
                if (!taskListView){
                    return;
                }
                
                taskView = taskListView.newTaskView;
                taskElem = taskView && taskView.elem;
                
                if (taskElem && !taskElem.is(e.target) && !taskElem.has(e.target).length && !taskView.hasUnsavedDescription()){
                    taskListView.cancelEdit();
                }
            });
        
        Tasket
            // Manage starred tasks
            .bind("task:change:starred", function(task, isStarred){
                var user = app.currentUser,
                    taskId = task.id,
                    taskIds = user.get("stars.tasks"),
                    origLength = taskIds.length;
                
                taskIds = _.without(taskIds, taskId);
                if (isStarred){
                    taskIds.push(taskId);
                }
                
                if (taskIds.length !== origLength){
                    user.set({"stars.tasks": taskIds});
                }
            })
            // When a hub (i.e. a list of tasks) is deleted or archived, then show a different hub
            .bind("hub:remove", function(hub){
                var selectedHub = app.selectedHub;

                if (selectedHub && hub.id === selectedHub.id){
                    controller.showLatestOrNew();
                }
                controller.hubListView.collection.remove(hub);
            })
            .bind("hub:change:archived", function(hub, isArchived){
                var selectedHub = app.selectedHub;
                
                if (isArchived && selectedHub && hub.id === selectedHub.id){
                    controller.showLatestOrNew();
                }
                controller.hubListView.collection.remove(hub);
            });
    },

    createTaskList: function () {
        // Because the view has an id of "content", it will replace the existing #content element
        this.taskListView = new TaskListView();

        return this;
    },
    
    showLatestOrNew: function(user){
        var controller = this,
            hubId;
        
        user = user || app.currentUser;
        if (user) {
            hubId = user.getLatestIncompleteHub();

            if (hubId) {
                this.showHub(hubId);
            }
            else {
                this.newHub();
            }
        }
        return this;
    },
    
    // TODO: merge with newHub()
    createHub: function(hub){
        var controller = this;
        app.selectedHub = hub;
    
        if (hub.isNew()) {
            hub.bind("change:id", _.once(function () {
                // add to global cache
                Tasket.hubs.add(hub);
                controller.hubListView.collection.add(hub);
                controller.navigate(hub.url(), true);
            }));
        }
        return this;
    },

    newHub: function () {
        var user = app.currentUser,
            
            // Create a new hub with the default hub title
            hub = new Hub({
                title: app.lang.NEW_HUB,
                owner: user.id
            });
        
        // Clear the browser URL until the new hub's url appears when the hub id is retrieved
        this.navigate("/").createHub(hub);

        this.hubListView.selectHub(hub);
        this.taskListView.showHub(hub);
            
        hub.save();
        
        return this;
    },

    showHub: function (id) {
        var controller = this,
            hub;
            
        // Fallback for any browser that interprets the /hubs/:id route before the /hubs/new and /hubs/starred routes
        if (id === "new"){
            return this.newHub();
        }
        else if (id === "starred"){
            return this.showStarred();
        }

        if (app.selectedHub && app.selectedHub.id === id) {
            return this;
        }

        hub = app.selectedHub = Tasket.getHubs(id);

        // If the model is not complete we listen for the first "change" event. This
        // will be fired when the model is properly loaded from the server. We then
        // re-update the view and re-render.
        if (hub.isComplete()) {
            app.trigger("change:selectedHub", hub);
        }
        else {
            hub.bind("change", _.once(function(hub) {
                app.trigger("change:selectedHub", hub);
            }));
            
            // Not found on the server; show another hub
            hub.bind("notfound", _.once(function(hub) {
                hub.unbind();
                controller.showLatestOrNew();
            }));
        }
        
        // TODO: handle errors - e.g. hub was already deleted since user record last cached in localStorage
        
        return this;
    },

    createHubList: function () {
        var user = app.currentUser,
            hubs = Tasket.getHubs(user.getNonArchivedHubs()),
            hubListView = this.hubListView = new HubListView({
                collection: hubs
            });
        
        hubListView.render();
        return this;
    },
    
    showStarred: function(){
        var user = app.currentUser,
            tasks = Tasket.getTasks(user.get("stars.tasks")),
            taskListView = this.taskListView,
            hubListView = this.hubListView,
            starredElem = hubListView.itemList.find(".starred"),
            hub = app.selectedHub = new Hub({
                id: "starred",
                title: "Starred items",
                owner: user.id,
                tasks: tasks.toHubTasks()
            }),
            callback;

        function showStarred() {
            var starredCollection,
                removeUnstarred = function(task, isStarred){
                    if (!isStarred){
                        taskListView.taskViews[task.cid].remove();
                    }
                },
                unsetStarredHub = function(tasks){
                    app.unbind("change:selectedHub", unsetStarredHub);
                    starredCollection.unbind("change:starred", removeUnstarred);
                    starredElem.removeClass("active");
                    taskListView.mainContentElem.removeClass("starred");
                };
                
            tasks.unbind("reset", showStarred);
            app.trigger("change:selectedHub", hub)
               .bind("change:selectedHub", unsetStarredHub);
            
            starredCollection = taskListView.collection.bind("change:starred", removeUnstarred);
            starredElem.addClass("active");
            taskListView.mainContentElem.addClass("starred");
        }

        if (!tasks.isComplete()) {
            tasks.bind("reset", showStarred);
        }
        else {
            showStarred();
        }
        
        return this;
    }
});
