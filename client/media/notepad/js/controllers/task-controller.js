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
        
        _.bindAll(this,
            "selectHub"
        );

        // Set up views on login.
        app.bind("change:selectedHub", this.selectHub)
        
            // TODO: remove requirement for `once` method
           .bind("change:currentUser", _.once(function (user) {
                
                app.bodyElem
                    .addClass("loggedin")
                    // TODO: EXPERIMENTAL Hide the save / cancel controls
                    .addClass("hide-save-cancel");
                
                controller
                    .createHubList()
                    .createTaskList()
                    .hubListView.render();
            }));
        
        // keyboard shortcuts
        app.bodyElem
            .bind("keyup", function(event){
                var taskListView = controller.taskListView,
                    keyCode;
                
                // Only respond when taskView is not in task edit mode
                if (taskListView && !taskListView.inTaskEditMode() && app.currentUser) {
                    keyCode = event.keyCode ?
                        event.keyCode : event.which;
                    
                    // "n" or "N" for new task
                    if (keyCode === 78 || keyCode === 110){
                        taskListView.createTask();
                        return false;
                    }
                    
                    // "t" or "T" for list title
                    // TODO
                }
            })
            
            // If the user clicks off an edited task, then save the currently active task
            .bind("click", function(event){
                var taskListView = controller.taskListView,
                    taskView, taskElem;
                    
                if (!taskListView){
                    return;
                }
                
                taskView = taskListView.activeTaskView();
                
                if (taskView && taskView.hasUnsavedDescription()){
                    taskElem = taskView.elem;
                    
                    if (taskElem && !taskElem.is(event.target) && !taskElem.has(event.target).length){
                        taskListView.saveTask(taskView.model);
                    }
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
                var selectedHub = app.selectedHub,
                    collection = controller.hubListView.collection,
                    isInCollection = !!collection.get(hub.id);
                
                if (isInCollection){
                    collection.remove(hub);
                }

                if (selectedHub && hub.id === selectedHub.id){
                    controller.showLatestOrNew();
                }
            })
            
            .bind("hub:change:archived", function(hub, isArchived){
                var selectedHub = app.selectedHub,
                    collection = controller.hubListView.collection,
                    isInCollection = !!collection.get(hub.id);
                
                if (isArchived){
                    // Remove the hub
                    if (isInHubList){
                        collection.remove(hub);
                    }
                }
                else {
                    // Add the hub
                    if (!isInHubList){
                        collection.add(hub);
                    }
                }
            });
    },

    createTaskList: function () {
        var controller = this,
            taskListView = this.taskListView = new TaskListView();
        
        taskListView
            .bind("add", function(task){
                // Add to global cache if not yet in the cache
                if (!task.isNew() && !Tasket.tasks.get(task.id)){
                    Tasket.tasks.add(task);
                }
                // If not yet saved on server, then add to global cache when saved
                else {
                    task.bind("change:id", function(task){
                        Tasket.tasks.add(task);
                    });
                }
            })
            .bind("remove", function(task){
                // Remove from global cache
                if (!task.isNew() && Tasket.tasks.get(task.id)) {
                    Tasket.tasks.remove(task);
                }
            })

        return this;
    },

    createHubList: function () {
        var hubs = Tasket.getHubs(app.currentUser.getNonArchivedHubs()),
            hubListView = this.hubListView = new HubListView({
                collection: hubs
            });
        
        hubListView
            .bind("add", function(hub){
                // Add to global cache if not yet in the cache
                if (!hub.isNew() && !Tasket.hubs.get(hub.id)){
                    Tasket.hubs.add(hub);
                }
                // If not yet saved on server, then add to global cache when saved
                else {
                    hub.bind("change:id", function(hub){
                        Tasket.hubs.add(hub);
                    });
                }
            })
            .bind("remove", function(hub){
                if (!hub.isNew() && Tasket.hubs.get(hub.id)) {
                    Tasket.hubs.remove(hub);
                }
            });
            
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
        if (hub.isNew()){
            // Clear browser address
            this.navigate("/");
            
            hub.bind("change:id", _.once(function () {
                controller.hubListView.collection.add(hub);
                controller.navigate(hub.url(), true);
            }));
        }
        return this;
    },

    newHub: function () {
        var hub = new Hub({
            owner: app.currentUser.id
        });
        
        this.createHub(hub);
        this.taskListView.showHub(hub);
        this.hubListView.selectHub(hub);
        hub.save();
        
        return this;
    },
    
    selectHub: function(hub, opts){
        // Don't show archived hubs; they are to be treated like deleted hubs, unless archiving is integrated into the UI
        if (hub.isArchived()){
            return this.showLatestOrNew();
        }
    
        opts = opts || {};
        
        if ("showTasksOfType" in opts) {
            app.cache.set("showTasksOfType", opts.showTasksOfType);
        }
        else {
            opts.showTasksOfType = app.cache.get("showTasksOfType") ?
                app.cache.get("showTasksOfType") : "onlyIncomplete";
        }
        
        if (app.currentUser) {
            this.navigate(hub.url());
            this.hubListView.selectHub(hub);
            this.taskListView.showHub(hub, opts);
        }
        return this;
    },

    showHub: function (id) {
        var controller = this,
            hub;
            
        // Fallback for any browser that interprets the /hubs/:id route before the /hubs/new and /hubs/starred routes
        if (id === "new"){
            return this.newHub();
        }
        
        if (id === "starred"){
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
            this.selectHub(hub);
            app.trigger("change:selectedHub", hub);
            // This will call this.selectHub()
            // TODO: clean up this pathway; minimise need to trigger custom event
        }
        else {
            // Clear browser address
            this.navigate("/");
            
            hub.bind("change", _.once(function(hub) {
                hub.unbind();
                controller.showHub(hub);
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
    
    showStarred: function(){
        var user = app.currentUser,
            tasks = Tasket.getTasks(user.get("stars.tasks")),
            taskListView = this.taskListView,
            hubListView = this.hubListView,
            starredElem = hubListView.hubListElem.find(".starred"),
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
                        taskListView.collection.remove({silent:true});
                    }
                },
                unsetStarredHub = function(newHub){
                    if (newHub.id !== hub.id){
                        app.unbind("change:selectedHub", unsetStarredHub);
                        starredCollection.unbind("change:starred", removeUnstarred);
                        starredElem.removeClass("active");
                        taskListView.mainContentElem.removeClass("starred");
                    }
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
