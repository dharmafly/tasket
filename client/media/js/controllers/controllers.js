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

    addHubs: function(hubs){
        _(hubs).each(this.addHub, this);
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
            offset = { // TODO TEMP
                left: randomInt(window.innerWidth - 550) + 50, // window.innerWidth / 3,
                top: randomInt(window.innerHeight - 200) + 100 // window.innerHeight / 2
            };
        }

        hubView = this.hubViews[hub.cid] = new HubView({
            model: hub,
            offset: offset
        });

        hubView.bind("select", this._onSelectHubs);

        app.bodyElem.append(hubView.elem);
        hubView.render();

        // TODO TEMP
        if (!window.hubViews){
            window.hubViews = [];
        }
        window.hubViews.push(hubView);

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
