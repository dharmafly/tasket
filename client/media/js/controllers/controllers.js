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
        this.wallTop = window.innerHeight - wallBuffer - app.toolbar.elem.outerHeight(true);
        this.wallBottom = wallBuffer;
        
        return this;
    },

    initialize: function(options){
        this.hubViews = {};
        this.hubForceDirector = app.createForceDirector();
        this.calculateWalls(); // TODO: recalculate on window.resize
        
        if (options && options.hubs){
            this.addHubs(options.hubs);
        }

        // Watch for new hubs and add them to the tank.
        Tasket.hubs.bind('add', _.bind(function(hub){
            // If the hub isn't yet shown in the tank, and it still has open tasks
            if (!this.getHubView(hub.id) && hub.isOpen()){
                this.addHub(hub);
            }
        }, this));

        _.bindAll(this, "_onSelectHubs");
    },

    getHubView: function(id){
        id = String(id); // allow argument to be a Number
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
        hubView.forcedNode = this.hubForceDirector.engine.addTask({
            key: hubView.model.id,
            x: offset.left,
            y: offset.top,
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
            hubView.showTasks();
        }
        return this;
    },

    newHub: function(){
        var form;

        if (!this._isLoggedIn('You must be logged in to create a hub')) {
            return;
        }

        form = this._createHubForm(new Hub({
            owner: app.currentUser.id
        }));

        form.bind('success', _.bind(function (hub) {
            var hubs = _.clone(app.currentUser.get('hubs.owned'));

            // Add hubs to global cache.
            Tasket.hubs.add(hub);

            hubs.push(hub.id);
            app.currentUser.set({
                'hubs.owned': hubs
            });

            this.addHub(hub);
        }, this));
    },

    editHub: function (id) {
        var hub = Tasket.getHubs([id]).at(0);
        if (!this._isLoggedIn('You must be logged in to edit a hub')) {
            return;
        }
        if (!this._isOwner(hub.get('owner'), 'You do not own this hub')) {
            return;
        }
        this._createHubForm(hub);
    },

    _isLoggedIn: function (message) {
        if (!app.currentUser) {
            this.error(message || 'You must be logged in');
        }
        return !!app.currentUser;
    },

    _isOwner: function (id, message) {
        var isUser = app.isCurrentUser(id);
        if (!isUser) {
            this.error(message || 'You do not have permission to do this');
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
        form.bind('success', _.bind(function () {
            app.lightbox.hide();
        }, this));

        return form;
    },

    newTask: function(hubId){
        var hub = Tasket.getHubs([hubId]).at(0),
            form;

        if (!this._isLoggedIn('You must be logged in to create a task')) {
            return;
        }

        if (!this._isOwner(hub.get('owner'), 'You do not own this hub')) {
            return;
        }

        this._createTaskForm(hub, new Task({
            hub: hubId, // NOTE: Verify this when refactoring hubs.
            owner: app.currentUser.id
        }));
    },

    editTask: function (hubId, taskId) {
        var hub  = Tasket.getHubs([hubId]).at(0),
            task = Tasket.getTasks([taskId]).at(0);

        if (_.indexOf(hub.getTasks(), taskId) < 0) {
            this.error("This task does not exist on this hub");
            return;
        }

        if (!this._isLoggedIn('You must be logged in to create a task')) {
            return;
        }

        if (!this._isOwner(hub.get('owner'), 'You do not own this hub')) {
            return;
        }

        this._createTaskForm(hub, task);
    },

    _createTaskForm: function (hub, task) {
        var form = new TaskForm({model: task});

        app.lightbox.content(form.render().el).show();
        form.bind("success", _.bind(function (event) {
            app.lightbox.hide();
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
        var hubViews = this.hubViews,
            overallCallback;
    
        function updateHubViewsOffset(){
            _.each(hubViews, function(hubView){
                var pos = hubView.forcedNode.getPos();
                
                hubView.offset({
                    left: ~~(pos.x - hubView.descriptionWidth / 2), // NOTE: ~~n === Math.floor(n)
                    top: ~~(pos.y + hubView.nucleusWidth / 2)
                });
            });
        }
    
        if (callback){
            overallCallback = function(){
                updateHubViewsOffset();
                callback.call(this);
            };
        }
        else {
            overallCallback = updateHubViewsOffset;
        }
        
        _.extend(this.hubForceDirector.options, {
            wallTop: this.wallTop,
            wallBottom: this.wallBottom,
            wallLeft: this.wallLeft,
            wallRight: this.wallRight,
            animate: animate ? updateHubViewsOffset : null,
            callback: overallCallback
        });
        this.hubForceDirector.initialized = true;
        
        return this;
    },
      
    forcedirectHubs: function(animate, callback){
        var tankController = this,
            hubForceDirector = this.hubForceDirector;
        
        if (!hubForceDirector.initialized){
            this.initializeForceDirector(animate, callback);
        }
        
        // Show the walls
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + (this.wallRight-this.wallLeft) + "px; top:" + (window.innerHeight - this.wallTop) + "px; height: " + (this.wallTop - this.wallBottom) + "px; left:" + this.wallLeft + "px;'></div>").appendTo("body");
        
        hubForceDirector.go();
        return this;
    }
});

// Handles signup/about/login etc.
var PageController = Backbone.Controller.extend({
    routes: {
        '/about/':   'about',
        '/login/':   'login',
        '/sign-up/': 'signup',
        '/account/': 'account'
    },

    constructor: function PageController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    about: function () {
        app.lightbox.content(tim('about')).show();
    },

    login: function () {
        var form = new Login();
        app.lightbox.content(form.render().el).show();

        form.bind('success', function (user) {
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

        form.bind('success', function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification.success('Your account has been created!');
        });
    },

    account: function () {
        var form = new Account({
            model: app.currentUser
        });

        if (!app.currentUser) {
            window.location.hash = '#/login';
        }

        app.lightbox.content(form.render().el).show();

        // Append iframe for avatar upload.
        form.updateFrame();

        form.bind('success', function (user) {
            app.lightbox.hide();
            app.notification.success('Your account has been updated!');
        });
    }
});

var DashboardController = Backbone.Controller.extend({
    routes: {
        '/dashboard/user/:id': 'showUser',
        '/dashboard/tasks/':   'showCurrentUserTasks',
        '/dashboard/hubs/':    'showCurrentUserHubs'
    },

    constructor: function DashboardController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    showCurrentUserTasks: function () {
        var user = app.currentUser;
    },

    showCurrentUserHubs: function () {
        var user = app.currentUser;
        app.dashboard.detail.title('My Projects').show();
    }
});
