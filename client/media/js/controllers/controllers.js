var TankController = Backbone.Controller.extend({
    routes: {
        "/hubs/new/": "newHub",
        "/hubs/:id/": "displayHub"
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

    addHub: function(hub){
        if (this.getHubView(hub.id)) {
            return;
        }

        var hubView = this.hubViews[hub.cid] = new HubView({
            model: hub,

            offset: { // TODO: Make useful
                left: randomInt(window.innerWidth - 550) + 50, // window.innerWidth / 3,
                top: randomInt(window.innerHeight - 200) + 100 // window.innerHeight / 2
            }
        });
        
        hubView.bind("select", this._onSelectHubs);

        // TODO: move bodyElem to app.bodyElem
        bodyElem.append(hubView.elem);
        hubView.render();

        return this;
    },

    displayHub: function(id){
        var controller = this,
            hubView = this.getHubView(id);

        if (hubView){
            hubView.select();
            if (!hubView.tasksVisible()){
                hubView.renderTasks();
            }
        }
        else {
            Tasket.fetchAndAdd(id, Tasket.hubs, function(){
                controller.displayHub(id);
            });
        }
        return this;
    },

    newHub: function(){
        var form = new HubForm({
            model: new Hub({
                owner: app.currentUser.id
            })
        });

        app.lightbox.content(form.render().el).show();
        form.bind('success', _.bind(function (event) {
            this.addHub(form.model);
            app.lightbox.hide();
        }, this));
    }
});

// Handles signup/about/login etc.
var PageController = Backbone.Controller.extend({
    routes: {
        '/about/':   'about',
        '/login/':   'login',
        '/logout/':  'logout',
        '/sign-up/': 'signup'
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
    },

    logout: function () {

    },

    signup: function () {
        var form = new SignUp({
            model: new User({
                realname: ''
            })
        });

        app.lightbox.content(form.render().el).show();
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

