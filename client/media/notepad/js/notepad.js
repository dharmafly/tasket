// notepad.js is the Notepad app's specific app.js
// TODO: more tank-related functionality out of app.js and into tank.js

_.extend(app, {
    selectedHub: null,
    currentUser: null,
    authtoken: null,
    csrftoken: null,
    bodyElem: jQuery(document.body),
    cache: cache,

    _setupOverrides: function () {
        // Always set task records as private so that
        // they can be accessed only by the their owner.
        Task.prototype.defaults.privacy = true;
        
        return this;
    },

    _setupLightbox: function(){
        var lightbox = app.lightbox = new Lightbox();

        this.bodyElem.append(lightbox.render().el);
        // Return to the previous route when the lightbox closes
        lightbox.bind("hide", function(){
            app.back(lightbox.historyCount);
        });
        return this;
    },

    _setupAuth: function(){
        // Need to restore the user from the cache once all the hubs are loaded.
        // This ensures that the users hubs are not requested before Tasket.hubs
        // is reset.
        this.restoreCache().setupAuthentication();

        // Destroy the cached user details when the logout button is clicked.
        // This block can be removed once Ticket #84 has been resolved and the
        // server deletes the "sessionid" cookie on logout:
        // https://github.com/dharmafly/tasket/issues/84
        jQuery("form[action='/logout/']").submit(function (event) {
            app.destroyCache();
        });

        return this;
    },
    
    getLatestOpenHub: function(user){
        return _.max(user.getNonArchivedHubs());
    },

    _bindHubEvents: function (user) {
        var hubId = this.getLatestOpenHub(user),
            hub;
        
        // There is already a hub we can load
        if (hubId){
            hub = app.selectedHub = Tasket.getHubs(hubId);
            
            // If the hub data is complete
            if (hub.isComplete()){
                app.trigger("change:selectedHub", hub);
            }
            // Otherwise data load from the server
            else {
                hub.bind("change", function onLoad(){
                    hub.unbind("change", onLoad);
                    app.trigger("change:selectedHub", hub);
                });
            }
            // TODO: handle errors - e.g. hub was already deleted since user record last cached in localStorage
        }
        
        // No existing hubs. Create a new one
        else {
            hub = app.selectedHub = new Hub({
                title: app.lang.NEW_HUB,
                owner: user.id
            });
            
            hub.bind("change:id", function (hub) {
                app.trigger("change:selectedHub", hub);
            });
        }
        
        return this;
    },

    /*
    * Creates a placeholder task list ('hub') on user login if the user has not
    * created one already.
    *
    */
    _setupHub: function () {
        this.bind("change:currentUser", function (user) {
            // user record is in localStorage
            if (user.id) {
                this._bindHubEvents(user);
            }
            else {
                // this will not be triggered when the user record is cached,
                // as the user id will be unchanged when the server responds
                user.bind("change:id", this._bindHubEvents);
            }
        });
        
        return this;
    },

    _setupHistory: function(){
        // If user lands on root update the url to "/#/" for consistency. This
        // can be removed should the history API be implemented.
        if (!window.location.hash) {
            window.location.hash = "/";
        }

        Backbone.history.start();
        return this;
    },

    bootstrap: function () {
        this.controller = new TaskController();
        this.accountController = new AccountController();
        this.toolbar = new Toolbar({el: document.getElementById("mainnav")});
        
        this.setupStaticTemplates()
            .bind("change:currentUser", this._cacheChangesToCurrentUser); // NOTE: "change:currentUser" fires once on retrieval from localStorage, and once again on retrieval from the server, to refresh the localStorage cache
        
        this._setupOverrides()
            ._setupLightbox()
            ._setupAuth()
            ._setupHub() // NOTE: hub setup after auth, to prevent double-load of view
            ._setupHistory();

        if (!app.currentUser){
            jQuery("section#content").html(tim("welcome-msg"));
        }

        // Load the server settings.
        // Override the value of Tasket.settings with the
        // values returned from the server
        this.init(app._cacheServerSettings());
    }
});
