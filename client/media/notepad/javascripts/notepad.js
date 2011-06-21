// notepad.js is the Notepad app's specific app.js
// TODO: more tank-related functionality out of app.js and into tank.js

_.extend(app, {
    selectedHub: null,
    currentUser: null,
    authtoken: null,
    csrftoken: null,
    bodyElem: jQuery(document.body),
    cache: cache,

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


    /*
    * Creates a placeholder task list ('hub') on user login if the user has not
    * created one already.
    *
    * Returns nothing.
    *
    */
    _initHub: function () {
        this.bind("change:currentUser", function (user) {
            var userHubs = user.get("hubs.owned"),
                newHub;

            if (!userHubs.length) {
                newHub = new Hub({
                    title: app.lang.NEW_HUBS,
                    owner: user.id
                });
                newHub.save();
            }
        });

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

        this._setupLightbox()
            ._setupAuth()
            ._setupHistory()
            ._initHub();

    }

}, app);
