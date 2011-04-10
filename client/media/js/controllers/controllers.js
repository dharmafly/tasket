var TankController = Backbone.Controller.extend({
    routes: {
        "/hubs/new/": "newHub",
        "/hubs/:id/": "displayHub",
        "/hubs/:id/edit/": "editHub",
        "/hubs/:id/tasks/new/": "newTask",
        "/hubs/:hub_id/tasks/:id/edit/": "editTask"
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
        
         // NOTE: this is zero-bottom y
        this.wallTop = window.innerHeight - wallBuffer - app.toolbar.elem.outerHeight(true);
        this.wallBottom = wallBuffer;
        
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
                tank.calculateWalls()
                    .forcedirectHubs();
                    //.forcedirectTasks(); // TODO: not currently working (canvas lines move out of sync)
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

    _onSelectHubs: function(hubToExclude){
        _(this.hubViews)
            .chain()
            .reject(function(view){
                return view.model.id === hubToExclude.model.id;
            })
            .invoke("deselect");

        return this;
    },

    addHubs: function(hubs, options){
        _(hubs).each(function(hub){
            this.addHub(hub, {dontDraw:true});
        }, this);
        
        if (!options || !options.dontDraw){
            this.forcedirectHubs();
        }
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
        
        if (options.left && options.top){
            offset = {
                left: options.left,
                top: options.top
            };
        }
        else {
            offset = { // TODO IMPROVE
                left: window.innerWidth / 2 + (10 * Math.random() - 5),
                top: this.calculateHubViewOffsetTop(hubView)
            };
        }

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

        if (!options.dontDraw){
            this.forcedirectHubs();
        }

        return hubView;
    },

    displayHub: function(id){
        var controller = this,
            hubView = this.getHubView(id);

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
        if (!this._isLoggedIn("You must be logged in to edit a hub")) {
            return;
        }
        if (!this._isOwner(hub.get("owner"), "You do not own this hub")) {
            return;
        }
        this._createHubForm(hub);
    },

    _isLoggedIn: function (message) {
        if (!app.currentUser) {
            this.error(message || "You must be logged in");
        }
        return !!app.currentUser;
    },

    _isOwner: function (id, message) {
        var isUser = app.isCurrentUser(id);
        if (!isUser) {
            this.error(message || "You do not have permission to do this");
        }
        return isUser;
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

        return form;
    },

    newTask: function(hubId){
        var hub = Tasket.getHubs(hubId),
            form;

        if (!this._isLoggedIn("You must be logged in to create a task")) {
            return;
        }

        if (!this._isOwner(hub.get("owner"), "You do not own this hub")) {
            return;
        }

        this._createTaskForm(hub, new Task({
            hub: hubId, // NOTE: Verify this when refactoring hubs.
            owner: app.currentUser.id,
            estimate: Task.ESTIMATES[0].value
        }));
    },

    editTask: function (hubId, taskId) {
        var hub  = Tasket.getHubs(hubId),
            task = Tasket.getTasks(taskId);

        if (_.indexOf(hub.getTasks(), taskId) < 0) {
            this.error("This task does not exist on this hub");
            return;
        }

        if (!this._isLoggedIn("You must be logged in to create a task")) {
            return;
        }

        if (!this._isOwner(hub.get("owner"), "You do not own this hub")) {
            return;
        }

        this._createTaskForm(hub, task);
    },

    _createTaskForm: function (hub, task) {
        var form = new TaskForm({model: task}),
            tank = this;

        app.lightbox.content(form.render().el).show();
        form.bind("success", _.bind(function (event) {
            var hubView = tank.getHubView(hub.id);
        
            app.lightbox.hide({silent: true});
            
            // Add task to Tasket.tasks collection
            Tasket.tasks.add(task);
            
            // Add it to the hub
            hub.set({"tasks.new": hub.get("tasks.new").concat(task.id)});

            // Go to the hub's URL and re-render the tasks
            hubView
                .updateLocation()
                .refreshTasks();
        }, this));
    },

    error: function (message) {
        app.notification.error(
            message || "You do not have permission to access this"
        );
        app.back();
    },
    
    calculateHubViewOffsetTop: function(hubView){
        return (this.wallTop - this.wallBottom) - (hubView.model.weight() * (this.wallTop - this.wallBottom));
    },
    
    initializeForceDirector: function(animate, callback){
        var tank = this,
            hubViews = this.hubViews,
            overallCallback;
    
        function repositionHubs(){
            _.each(hubViews, function(hubView){
                var pos = hubView.forcedNodeHubToHub.getPos();
                
                hubView.offset({
                    left: ~~(pos.x - hubView.descriptionWidth / 2), // NOTE: ~~n === Math.floor(n)
                    top: app.invertY(~~(pos.y + hubView.nucleusWidth / 2))
                });
            });
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
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + (this.wallRight-this.wallLeft) + "px; top:" + (window.innerHeight - this.wallTop) + "px; height: " + (this.wallTop - this.wallBottom) + "px; left:" + this.wallLeft + "px; pointer-events:none;'></div>").prependTo("body");
        
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
        "/about/":   "about",
        "/login/":   "login",
        "/sign-up/": "signup",
        "/account/": "account"
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
        var form = new Account({
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
        app.dashboard.detail.title("My Projects").show();
    }
});
