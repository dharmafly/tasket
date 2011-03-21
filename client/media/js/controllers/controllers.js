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


    addHub: function(hub){
        var hubView = this.hubViews[hub.cid] = new HubView({
            model: hub,

            offset: { // TODO: Make useful
                left: randomInt(window.innerWidth - 550) + 50, // window.innerWidth / 3,
                top: randomInt(window.innerHeight - 200) + 100 // window.innerHeight / 2
            },
        });

        // TODO: move bodyElem to app.bodyElem
        bodyElem.append(hubView.elem);
        hubView.render();

        return this;
    },

    displayHub: function(id){
        var controller = this,
            hubView = this.getHubView(id);

        if (hubView){
            hubView.select().renderTasks();
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

        form.render().show();
        form.bind('all', _.bind(function (event) {
            if (event === 'close' || event === 'success') {
                window.history.back();
            }
            if (event === 'success') {
                this.addHub(form.model);
            }
        }, this));
    }
});

// Handles signup/about/login etc.
var PageController = Backbone.Controller.extend({
    routes: {
        '/about/':  'about',
        '/login/':  'login',
        '/logout/': 'logout',
        '/signup/': 'signup'
    },

    constructor: function PageController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
    },

    about: function () {
        lightbox.render(tim('about')).show().bind('close', function () {
            window.history.back();
        });
    },

    login: function () {
    
    },

    logout: function () {
    
    },

    signup: function () {

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
    }
});

