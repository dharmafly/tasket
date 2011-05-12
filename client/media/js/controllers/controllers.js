var TankController = Backbone.Controller.extend({
    routes: {
        "/hubs/new/": "newHub",
        "/hubs/:id/": "displayHub",
        "/hubs/:id/edit/": "editHub",
        "/hubs/:id/tasks/new/": "newTask",
        "/hubs/:hub_id/tasks/:id/edit/": "editTask",
        "/hubs/:hub_id/tasks/:id/": "displayTaskDetails",
        "/hubs/:hub_id/detail/" : "displayHubDetails"
    },

    constructor: function TankController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    // Get the dimensions of the tank
    calculateWalls: function(){
        var wallBuffer = app.wallBuffer;

        this.wallBuffer = wallBuffer;
        this.wallRight = app.dashboard.elem.offset().left - wallBuffer;
        this.wallLeft = wallBuffer;
        this.width = this.wallRight - this.wallLeft;

         // NOTE: this is zero-bottom y
        this.wallTop = window.innerHeight - wallBuffer - app.toolbar.elem.outerHeight(true);
        this.wallBottom = wallBuffer;
        this.height = this.wallTop - this.wallBottom;
        this.marginTop = window.innerHeight - this.wallTop;

        _.extend(this.forceDirector.options, {
            wallTop: this.wallTop,
            wallBottom: this.wallBottom,
            wallLeft: this.wallLeft,
            wallRight: this.wallRight
        });

        return this;
    },

    initialize: function(options){
        var tank = this;
        this.hubViews = {};
        this.forceDirector = app.createForceDirector();
        
        // TODO TEMP visualising forcedirector
        //window.tasket_app.world.tk.reset();
        //this.forceDirector.engine = window.tasket_app.world.tk;
        
        this.calculateWalls();

        if (options && options.hubs){
            this.addHubs(options.hubs);
        }

        // Watch for new hubs and add them to the tank.
        Tasket.hubs.bind("add", _.bind(function(hub){
            // If the hub isn't yet shown in the tank, and it still has open tasks
            if (!this.getHubView(hub.id) && hub.isOpen()){
                this.addHub(hub);
            }
        }, this));

        jQuery(window).bind("resize", throttle(function(){
            if (tank.forceDirector.initialized){
                //tank.calculateWalls()
                //    .forcedirectHubs();
                tank.repositionHubViews();
            }
        }, app.tankResizeThrottle, true));

        _.bindAll(this, "_onSelectHubs");
    },

    getHubView: function(id){
        id = String(id); // allow argument to be a String or a Number

        return _(this.hubViews).detect(function(hubView){
            return id === hubView.model.id;
        });
    },

    /*
    getTaskView: function(id){
        id = String(id); // allow argument to be a String or a Number
        
        var task = Tasket.getTasks(id),
            hubId = task && task.get("hub"),
            hubView = hubId && this.getHubView(hubId);

        return hubView && hubView.taskViews && hubView.taskViews.detect(function(taskView){
            return taskView.model.id === id;
        });
    },
    */

    _onSelectHubs: function(selectedHubView){
        _(this.hubViews)
            .chain()
            .reject(function(view){
                return view.model.id === selectedHubView.model.id;
            })
            .invoke("deselect");
            
        return this.trigger("hub:select", selectedHubView, this);
    },

    addHubs: function(hubs, options){
        var tank = this,
            hubViewOptions;
    
        _(hubs).each(function(hub){
            this.addHub(hub, {dontDraw:true});
        }, this);

        if (!options || !options.dontDraw){
            this.calculateHubWeights();
        
            _(this.hubViews).each(function(hubView){
                tank.drawHubView(hubView);
            });
            this.forcedirectHubs();
        }
        return this;
    },
    
    getHubWeights: function(){
        return _(this.hubViews).map(function(hubView){
            return hubView.model.weight();
        });
    },
    
    calculateHubWeights: function(){
        var hubWeights = this.hubWeights = this.getHubWeights();
        this.hubWeightMin = Math.min.apply(Math, hubWeights);
        this.hubWeightMax = Math.max.apply(Math, hubWeights);
        this.hubWeightRange = this.hubWeightMax - this.hubWeightMin;
        
        return this;
    },

    hubViewOffsetTop: function(hubView){
        if (_.isUndefined(this.hubWeights)){
            throw "tank.hubViewOffsetTop: Must call tank.calculateHubWeights() first"; 
        }
    
        var weight = hubView.model.weight(),
            adjustedWeight = weight / this.hubWeightRange + this.hubWeightMin;

        return adjustedWeight * (this.height - 90) + this.marginTop + 90; // 90 is expected hubView height
    },
    
    hubViewOffset: function(hubView){
        return {
            left: this.width / 2 + this.wallLeft + (this.width * Math.random() - this.width / 2),
            top: this.hubViewOffsetTop(hubView) // if options.hubWeightRange is undefined or 0, then absolute weight used
        };
    },
    
    setHubViewOffsetFromForcedNode: function(hubView){
        var pos = hubView.forcedNodeHubToHub.getPos();

        hubView.offset({
            left: ~~(pos.x - hubView.descriptionWidth / 2), // NOTE: ~~n === Math.floor(n)
            top: app.invertY(~~pos.y)
        });
    },
    
    repositionHubViews: function(){
        var tank = this;
        
        this.calculateWalls()
            .calculateHubWeights();
        
        _(this.hubViews).each(function(hubView){
            var offsetTop = tank.hubViewOffsetTop(hubView),
                forcedNode = hubView.forcedNodeHubToHub;
                
            // Set position of force-directed representation, with respect to other hubs
            forcedNode.setPos(
                forcedNode.getPos().x,
                app.invertY(offsetTop)
            );
            
            // Set position of DOM element
            tank.setHubViewOffsetFromForcedNode(hubView);
            
            // Set position of force-directed representation, with respect to tasks - TODO: combine these
            hubView.updateForceDirectedDimensions();
        });
        
        return this.forcedirectHubs();
                    //.forcedirectTasks(); // TODO: not currently working (canvas lines move out of sync)
    },
    
    drawHubView: function(hubView, options){
        var offset;
    
        options = options || {};
    
        if (options.left && options.top){
            offset = {
                left: options.left,
                top: options.top
            };
        }
        else {
            offset = this.hubViewOffset(hubView, options.hubWeightRange); // if options.hubWeightRange === undef, a standard range will be used
        }

        hubView.offsetValues(offset);
        app.bodyElem.append(hubView.elem);
        hubView.render();
        
        // Add the hub to the forcedirector engine (not a task, even though the method is `addTask`)
        hubView.forcedNodeHubToHub = this.forceDirector.engine.addTask({
            key: "hub-" + hubView.model.id,
            x: offset.left,
            y: app.invertY(offset.top),
            width: hubView.width + hubView.nucleusWidth, // NOTE: hubView.nucleusWidth is used as a margin between hubs
            height: hubView.height
        });
        
        return this;
    },

    addHub: function(hub, options){
        var hubView, offset;

        if (this.getHubView(hub.id)) {
            return this;
        }

        options = options || {};

        hubView = this.hubViews[hub.cid] = new HubView({
            model: hub
        });

        hubView.bind("select", this._onSelectHubs);

        if (!options.dontDraw){
            this.drawHubView(hubView)
                .forcedirectHubs();
        }

        return hubView;
    },

    // Remove a hub from the tank.
    removeHub: function (id) {
        var hubView = this.getHubView(id);
        if (hubView) {
            this.hubViews = _.without(this.hubViews, hubView);
            hubView.deselect().remove();
        }
        return this;
    },

    displayHub: function(hubId){
        var controller = this,
            hubView = this.getHubView(hubId);

        if (hubView){
            hubView.sendToFront().showTasks();
        }
        return this;
    },

    newHub: function(){
        var form;

        if (!this._isLoggedIn("You must be logged in to create a hub")) {
            return;
        }

        form = this._createHubForm(new Hub({
            owner: app.currentUser.id
        }));

        form.bind("success", _.bind(function (hub) {
            var hubs = _.clone(app.currentUser.get("hubs.owned"));

            // Add hubs to global cache.
            Tasket.hubs.add(hub);

            hubs.push(hub.id);
            app.currentUser.set({
                "hubs.owned": hubs
            });

            this.addHub(hub);
        }, this));
    },

    editHub: function (id) {
        var hub = Tasket.getHubs(id);
            
        if (!this._isLoggedIn("You must be logged in to edit this.")) {
            return;
        }
        if (!this._hasAdminRights(hub.get("owner"), "You cannot edit this, because you do not own it and you are not an admin.")) {
            return;
        }
        this.displayHub(id)
            ._createHubForm(hub);
    },

    _isLoggedIn: function (message) {
        if (!app.currentUser) {
            this.error(message || "You must be logged in");
        }
        return !!app.currentUser;
    },

    _hasAdminRights: function (id, message) {
        var hasRights = app.isCurrentUser(id) || app.currentUserIsAdmin();
        if (!hasRights) {
            this.error(message || "Sorry, you do not have permission to do that.");
        }
        return hasRights;
    },

    _createHubForm: function (hub) {
        var form = new HubForm({
            model: hub
        });

        app.lightbox.content(form.render().el).show();

        // Append our iFrame element for upload.
        form.updateFrame();
        form.bind("success", _.bind(function () {
            app.lightbox.hide();
            HubView.prototype.updateLocation.call({model:hub});
        }, this));

        form.bind("delete", _.bind(function (model) {
            app.currentUser.removeHub(model);
            this.removeHub(model.id);
            Tasket.hubs.remove(model);
            app.lightbox.hide();
            window.location.hash = "/";
        }, this));

        return form;
    },
    
    // TODO: this should work even when the task view isn't yet available - i.e. via an async request to API
    // TODO: lightbox should close if a link from within the task description is clicked
    displayHubDetails: function(hubId){
        var hubView = this.getHubView(hubId);
            
        if (hubView){
            hubView.displayDetails();
        }
        
        return this;
    },
    
    // TODO: this should work even when the task view isn't yet available - i.e. via an async request to API
    // TODO: lightbox should close if a link from within the task description is clicked
    displayTaskDetails: function(hubId, taskId){
        taskId = String(taskId); // allow argument to be a String or a Number
        
        var hubView = this.getHubView(hubId),
            taskView = hubView && hubView.taskViews && hubView.taskViews.detect(function(taskView){
                return taskView.model.id === taskId;
            });
            
        if (taskView){
            this.displayHub(hubId);
            taskView.displayDetails();
        }
        else if (hubView){
            hubView.updateLocation();
        }
        
        return this;
    },

    newTask: function(hubId){
        var hub = Tasket.getHubs(hubId),
            form;

        if (!this._isLoggedIn("You must be logged in to create a task.")) {
            return;
        }

        if (!this._hasAdminRights(hub.get("owner"), "You cannot create a task here on this " + app.lang.HUB + ", because you do not own it and you are not an admin.")) {
            return;
        }

        if (!hub.canAddTask()) {
            this.error("A " + app.lang.HUB + " can only have a maximum of " + Tasket.settings.TASK_LIMIT + " unverified tasks");
            return;
        }

        this.displayHub(hubId)
            ._createTaskForm(hub, new Task({
                hub: hubId, // NOTE: Verify this when refactoring hubs.
                owner: app.currentUser.id,
                estimate: Task.ESTIMATES[0].value
            }));
    },

    editTask: function (hubId, taskId) {
        var hub  = Tasket.getHubs(hubId),
            task = Tasket.getTasks(taskId);

        if (_.indexOf(hub.getTasks(), taskId) < 0) {
            this.error("This task does not exist on this " + app.lang.HUB + ".");
            return;
        }

        if (!this._isLoggedIn("You must be logged in to create a task.")) {
            return;
        }

        if (!this._hasAdminRights(hub.get("owner"), "You do not own this " + app.lang.HUB + ".")) {
            return;
        }

        this._createTaskForm(hub, task);
    },

    _createTaskForm: function (hub, task) {
        var form = new TaskForm({model: task}),
            tank = this;

        app.lightbox.content(form.render().el).show();
        form.bind("success", _.bind(function (event) {
            var hubView = tank.getHubView(hub.id),
                userTasks;

            app.lightbox.hide({silent: true});

            // Add task to Tasket.tasks collection if not already in there.
            if (!Tasket.tasks.get(task.id)) {
                Tasket.tasks.add(task);
                hub.addTask(task);
            }

            // Add to current users tasks if not already in there.
            if (
              task.get('state') === Task.states.NEW &&
              task.get('owner') === app.currentUser.id
            ) {
                userTasks = _.clone(app.currentUser.get('tasks.owned.new'));
                userTasks.push(task.id);
                app.currentUser.set({
                  'tasks.owned.new': userTasks
                });
            }
                
            tank.repositionHubViews();

            // Go to the hub's URL and re-render the tasks
            hubView
                .updateLocation()
                .refreshTasks();
        }, this));
        
        form.bind("delete", _.bind(function (model) {
            var view = this.getHubView(hub.id);
            if (view) {
                view.model.removeTask(task);
            }
            app.currentUser.removeTask(model);
            Tasket.tasks.remove(model);
            app.lightbox.hide();
        }, this));
    },

    error: function (message) {
        app.notification.error(
            message || "You do not have permission to access this."
        );
        app.back();
    },

    initializeForceDirector: function(animate, callback){
        //animate = true;
    
        var tank = this,
            hubViews = this.hubViews,
            overallCallback;

        function repositionHubs(){
            _.each(hubViews, tank.setHubViewOffsetFromForcedNode);
        }

        if (callback){
            overallCallback = function(){
                repositionHubs();
                tank.forcedirectTasks();
                callback.call(tank);
            };
        }
        else {
            overallCallback = repositionHubs;
        }
        
        _.extend(this.forceDirector.options, {
            animate: animate,
            animator: repositionHubs,
            callback: overallCallback
        });

        // Show the walls
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + this.width + "px; top:" + this.marginTop + "px; height: " + this.height + "px; left:" + this.wallLeft + "px; pointer-events:none;'></div>").prependTo("body");

        this.forceDirector.initialized = true;

        return this;
    },

    forcedirectHubs: function(animate, callback){
        if (!this.forceDirector.initialized){
            this.initializeForceDirector(animate, callback);
        }

        this.forceDirector.go();
        return this;
    },

    forcedirectTasks: function(){
        _.each(this.hubViews, function(hubView){
            if (hubView.taskViews){
                hubView.refreshTasks();
            }
        });
        return this;
    },

    forcedirectAll: function(){
        return this
            .forcedirectHubs()
            .forcedirectTasks();
    }
});

// Handles signup/about/login etc.
var PageController = Backbone.Controller.extend({
    routes: {
        "/about/":          "about",
        "/login/":          "login",
        "/forgot-details/": "forgotDetails",
        "/sign-up/":        "signup",
        "/account/":        "account",
        "/users/:id/change-password/": "changePassword"
    },

    constructor: function PageController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    about: function () {
        app.lightbox.content(tim("about")).show();
    },

    login: function () {
        var form = new Login();
        app.lightbox.content(form.render().el).show();

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
        });
    },
    
    forgotDetails: function () {
        var form = new ForgotDetails();
        app.lightbox.content(form.render().el).show();
    },

    signup: function () {
        var form = new SignUp({
            model: new User()
        });

        app.lightbox.content(form.render().el).show();

        // Append iframe for avatar upload.
        form.updateFrame();

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification.success("Your account has been created!");
        });
    },

    account: function () {
        var form = new ChangePassword({
            model: app.currentUser
        });

        if (!app.currentUser) {
            window.location.hash = "#/login";
        }

        app.lightbox.content(form.render().el).show();

        // Append iframe for avatar upload.
        form.updateFrame();

        form.bind("success", function (user) {
            app.lightbox.hide();
            app.notification.success("Your account has been updated!");
        });
    },

    changePassword: function (id) {
        var form = new ChangePassword({
            model: Tasket.getUsers(id)
        });

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
        });

        app.lightbox.content(form.render().el).show();
    }
});

var DashboardController = Backbone.Controller.extend({
    routes: {
        "/dashboard/user/:id": "showUser",
        "/dashboard/tasks/":   "showCurrentUserTasks",
        "/dashboard/hubs/":    "showCurrentUserHubs"
    },

    constructor: function DashboardController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    showCurrentUserTasks: function () {
        var user = app.currentUser;
    },

    showCurrentUserHubs: function () {
        var user = app.currentUser;
        app.dashboard.detail.title(app.lang.MY_HUBS).show();
    }
});
