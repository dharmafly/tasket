var TaskController = Controller.extend({
    routes: {
        "/": 'loadLatestOrNew',
        "/hubs/:hub/": 'showHub',
		"/hubs/new/": "newHub",
		"/tasks/starred/": "showStarred"
    },

    taskViewRendered: false,

   /*
    * Display object name in webkit console.
    */
    constructor: function () {
        var controller = this;

        Controller.apply(this, arguments);

        // Set up views on login.
        app.bind("change:currentUser", _.once(function () {
			jQuery('body').addClass('loggedin');
			controller.createHubList();
			controller.createTaskList();
        }));

        app.bind("change:selectedHub", function (hub, opts) {
            opts = opts || {};
            if ('showTasksOfType' in opts) {
                app.cache.set("showTasksOfType", opts.showTasksOfType);
            }else{
                opts.showTasksOfType = app.cache.get("showTasksOfType") ? app.cache.get("showTasksOfType") : 'onlyIncomplete';
            }
            
            if (app.currentUser) {
                controller.navigate('/hubs/' + hub.id + '/');
                controller.hubListView.selectHub(hub);
                controller.taskListView.showHub(hub, opts);
            };
        });
                
        Tasket.bind('hub:change:archived', function(hub, hublist){
            var hubId = app.getLatestOpenHub(app.currentUser);
            
            if (hubId) {
                // remove the deleted hub from the hublist collection, which will update view
                controller.hubListView.collection.remove(hub);
                app.selectHub(hubId);
            }
            else{
                app.createAndSelectHub();
            }

        });
        
        
        // keyboard shortcuts
        $('body').bind('keyup', function(e){
            var keyCode = e.keyCode ? e.keyCode : e.which;
            
            if (app.currentUser && controller.taskListView) {
                switch(keyCode){
                    case 78:
                        // 'n' for new task
                        if (!(controller.taskListView.newTaskView || controller.taskListView.editedTaskView)) {
                            controller.taskListView.createTask();
                            e.preventDefault();
                        };
                        break;

                    case 27:
                        // escape out of editing/creating a task
                        if (controller.taskListView.newTaskView || controller.taskListView.editedTaskView) {
                            controller.taskListView.cancelEdit();
                            e.preventDefault();
                        };
                        break;
                }
            }
            
        });
        
    },

    createTaskList: function () {
        var controller   = this,
            taskListView = this.taskListView = new TaskListView({
                model: new Hub({owner: app.currentUser.id})
            });

        // Render the list view. Because the view has an id of "content", it will replace the existing #content element
        taskListView.render();
		taskListView.renderTasks();

        //event handler for saving new items
        taskListView
            .bind("update-item", function (task, attrValues) {
                // Set a default description
                if ("description" in attrValues && _.isEmpty(attrValues.description)) {
                    attrValues.description = app.lang.EMPTY_TASK;
                }

                // task.save(attrValues);
                var request = task.save(attrValues);
                if (task.isNew()) {
                    request.success(function () {
                        taskListView.model.addTask(task);
                    });
                }
            })
            .bind("remove-item", function (task) {
                var request;
                
                if (task.isNew()) {
                    // remove task from the hub
                    taskListView.model.removeTask(task);
                }else{
                    request = task.destroy();
                    request.success(function () {
                        taskListView.model.removeTask(task);
                    });
                }
                
            });


		taskListView.bind('create-hub', function(hub){
			if (hub.isNew()) {
				hub.bind('change:id', _.once(function () {
				    // add to global cache
				    Tasket.hubs.add(hub);
                    controller.hubListView.collection.add(hub);
                    controller.navigate('/hubs/' + hub.id + '/', true);
				}));
			}
			app.selectedHub = hub;
		});

    },
    
    loadLatestOrNew: function(){
        if (!app.currentUser) {
            return;
        };
        
        var hubId = app.getLatestOpenHub(app.currentUser),
            controller = this;
      
        if (hubId) {
            app.trigger("change:selectedHub", Tasket.getHubs(hubId));
        }
        else{
            controller.navigate('/hubs/new/', true);
        }
    },

	newHub: function () {
        var controller = this,
			user = app.currentUser,
			hub = app.selectedHub = new Hub({
	            title: app.lang.NEW_HUB,
	            owner: user.id
        	});

		controller.taskListView.showHub(hub);
		controller.taskListView.toggleEdit();
	},

	showHub: function (id) {
	    var hub,
	        controller = this;

		if (app.selectedHub && app.selectedHub.id === id) {
            return;
		}

		if (Tasket.hubs.get(id)) {
    		hub = app.selectedHub = Tasket.getHubs(id);
		}
		else{
            // id does not exist any more, redirect to root
            controller.navigate('/', true);
            return;
		}
		

		// If the model is not complete we listen for the first "change" event. This
		// will be fired when the model is properly loaded from the server. We then
		// re-update the view and re-render.
		if (!hub.isComplete()) {
			hub.bind("change", _.once(function(hub) {
                app.trigger("change:selectedHub", hub);
			}));
		}
		
		else {
			app.trigger("change:selectedHub", hub);
		}
		
        // TODO: handle errors - e.g. hub was already deleted since user record last cached in localStorage
	},

    createHubList: function () {
		var controller = this,
			user = app.currentUser,
			hubs = Tasket.getHubs(user.getNonArchivedHubs()),
			hubListView = this.hubListView = new HubListView({
                collection: hubs
            });
        
		hubListView.render();
	},
	
	showStarred: function () {
	    var controller = this,
	        user = app.currentUser,
	        tasks = Tasket.getTasks(user.get("stars.tasks")),
	        taskListView = this.taskListView,
			hub = app.selectedHub = new Hub({
			    id: 'starred',
	            title: 'Starred items',
                owner: user.id,
                tasks: tasks.toHubTasks()
        	});

        function complete() {
            app.trigger("change:selectedHub", hub);
		    controller.taskListView.hideAddEditControls();
        }

		if (!tasks.isComplete()) {
			tasks.bind("reset", _.once(function (tasks) {
			    complete();
			}));
		} else {
            complete();
		}
	}
});
