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

    initialize: function(options){
        this.hubViews = {};
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
        return _(this.hubViews).detect(function(hubView){
            return id === hubView.model.id;
        });
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

    _onSelectHubs: function(hubToExclude){
        _(this.hubViews)
            .chain()
            .reject(function(view){
                return view.model.id === hubToExclude.model.id;
            })
            .invoke("deselect");

        return this;
    },

    addHub: function(hub, options){
        var hubView, offset;

        if (this.getHubView(hub.id)) {
            return this;
        }

        options = options || {};
        if (options.left && options.top){
            offset = {
                left: options.left,
                top: options.top
            };
        }
        else {
            offset = { // TODO IMPROVE
                left: window.innerWidth / 2 + (100 * Math.random() - 50),
                top: window.innerHeight / 2 + (100 * Math.random() - 50)
            };
        }

        hubView = this.hubViews[hub.cid] = new HubView({
            model: hub,
            offset: offset
        });

        hubView.bind("select", this._onSelectHubs);

        app.bodyElem.append(hubView.elem);
        hubView.render();

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
        form.bind('success', _.bind(function (event) {
            app.lightbox.hide();
        }, this));
    },

    error: function (message) {
        app.notification.error(
            message || 'You do not have permission to access this'
        );
        app.back();
    },
      
    forcedirectHubs: function(callback, animate){        
        var f = app.forcedirector,
            hubViews = this.hubViews,
            nucleusWidth, width, descriptionWidth, hubHubBuffer, wallBuffer, wallRight, wallLeft, wallTop, wallBottom, halfNucleusWidth,
            numCycles = 200,
            inCoulombK = 750,
            updateStep = 1,
            fps = 60,
            i = 0,            
            deltaTMin = 0.2,
            deltaTEase = 1.5,
            deltaTFactor = 0.01;
            
        f.reset();
        f.inCoulombK = inCoulombK;
        
        _.each(this.hubViews, function(hubView){
            var offset = hubView.offset(),
                id = hubView.model.id,
                height = hubView.nucleusWidth + hubView.labelElem.outerHeight(true); // NOTE height can vary for different hub descriptions
                
            if (!width){
                descriptionWidth = hubView.labelElem.outerWidth(true); // TODO ensure we only use dimensions of collapsed label
                nucleusWidth = hubView.nucleusWidth;
                halfNucleusWidth = nucleusWidth / 2;
                hubHubBuffer = nucleusWidth;
                width = hubView.nucleusWidth + descriptionWidth + hubHubBuffer;
                wallBuffer = halfNucleusWidth;
                wallRight = jQuery("section.dashboard").offset().left - wallBuffer;
                wallLeft = wallBuffer;
                wallTop = window.innerHeight - wallBuffer - jQuery("div.header-container").outerHeight(true);
                wallBottom = wallBuffer;
                
                f.wallsFlag = true;
                f.top = wallTop;
                f.bottom = wallBottom;
                f.left = wallLeft;
                f.right = wallRight;
            }
            
            hubView.offsetValues({
                left: offset.left,
                top: (wallTop - wallBottom) - (hubView.model.weight() * (wallTop - wallBottom)) // TODO: move into hubView method; spread across all y
            });
            
            // Add the hub to the forcedirector engine (not a task, even though the method is `addTask`)
            hubView.forcedNode = f.addTask({key:id, x:offset.left, y:offset.top, width: width, height: height});
        });
        
        // Show walls
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + (wallRight-wallLeft) + "px; top:" + (window.innerHeight - wallTop) + "px; height: " + (wallTop - wallBottom) + "px; left:" + wallLeft + "px;'></div>").appendTo("body");
        
        function updateHubViewsOffset(){
            _.each(hubViews, function(hubView){
                var pos = hubView.forcedNode.getPos();
                
                hubView.offset({
                    left: pos.x - descriptionWidth / 2,
                    top: pos.y + halfNucleusWidth
                });
            });
        }
        
        function loop(){
            f.updateCycle(deltaTMin + deltaTEase);
            deltaTEase = deltaTEase - (deltaTEase * deltaTFactor);
            
            if (i <= numCycles){
                if (animate){
                    updateHubViewsOffset();
                    
                    window.setTimeout(function(){
                        loop(++i);
                    }, 1000 / fps);
                }
                else {
                    loop(++i);
                }
            }
            else if (callback){
                callback();
            }
        }
        loop();
        updateHubViewsOffset();
        
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
