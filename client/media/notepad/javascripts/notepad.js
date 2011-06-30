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

        // Override the value of Tasket.settings with the
        // values returned from the server
        this._cacheServerSettings();
        
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
        // https://github.com/premasagar/tasket/issues/84
        jQuery("form[action='/logout/']").submit(function (event) {
            app.destroyCache();
        });

        return this;
    },


    _bindHubEvents: function (user) {
        var ownedHubs = user.get("hubs.owned"),
            hub;

        hub = app.selectedHub = ownedHubs.length ?

            // TODO:
            // this will fail if the local storage object is out of sync and the requested hub
            // has been deleted from the server. This edge case can be handled with an onError callback
            // that calls _bindHubEvents again.

            Tasket.getHubs(_.max(ownedHubs)) :
            new Hub({
                title: app.lang.NEW_HUB,
                owner: user.id
            });

        hub.bind("change:id", function (hub) {
            app.trigger("change:selectedHub", hub);
        });

        if (hub.isNew()) {
            Tasket.hubs.add(hub);
            hub.save();
        }

        return this;
    },


    /*
    * Creates a placeholder task list ('hub') on user login if the user has not
    * created one already.
    *
    * Returns nothing.
    *
    */
    _setupHub: function () {
      this.bind("change:currentUser", function (user) {

            //no need for a binding if the user record is in local storage
            if ("id" in user) {
               app._bindHubEvents(user);

            } else {
              // this will not get fired when the user record is cached,
              // as it will be the same than the one returned by the server

               user.bind("change:id", function userBinding() {
                 user.unbind("change:id", userBinding);
                 app._bindHubEvents();
               });
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
        // On changes to currentUser, cache the user to localStorage
        app.bind("change:currentUser", this._cacheChangesToCurrentUser);
        app.setupStaticTemplates();
        this._setupOverrides()
            ._setupHub()
            ._setupLightbox()
            ._setupAuth()
            ._setupHistory();

    }

}, app);
