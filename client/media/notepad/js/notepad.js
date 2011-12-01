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

    /*
    * Creates a placeholder task list ("hub") on user login if the user has not
    * created one already.
    *
    */
    _setupHub: function () {
        this.bind("change:currentUser", function (user) {
            // user record is in localStorage
            if (user.id) {
                this.controller.showLatestOrNew();
            }
            else {
                // this will not be triggered when the user record is cached,
                // as the user id will be unchanged when the server responds
                user.bind("change:id", _.bind(this.controller.showLatestOrNew, this.controller));
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
        this.router = new Backbone.Router();
        this.controller = new TaskController({router: this.router});
        this.accountController = new AccountController({router: this.router});
        this.toolbar = new Toolbar({el: document.getElementById("mainnav")});
        
        this.bind("change:currentUser", this._cacheChangesToCurrentUser)
            .setupStaticTemplates()
            ._setupOverrides()
            ._setupLightbox()
            ._setupAuth()
            // NOTE: _setupHub after _setupAuth, to prevent double-load of view
            ._setupHub()
            ._setupHistory();

        if (!app.currentUser){
            jQuery("section#content").html(tim("welcome-msg"));
            jQuery("body").removeClass("loggedin");

            // setup all the screenshots to go big on click
            jQuery(".features img").each(function(index, node) {
                
                jQuery(node).bind("click", function(){
                    var srcNode = jQuery(node).clone(),
                        bigImgPath = srcNode.attr("src"),
                        parts = bigImgPath.split(".");
                        
                    if(parts.length){
                        parts[parts.length-2] = parts[parts.length-2]  + "-big";
                        bigImgPath = parts.join(".");
                    }

                    app.lightbox.content(srcNode.attr({
                        "src": bigImgPath,
                        "width": 920,
                        "height": 500,
                    }), "wide").show();
                })
            });
        }

        // Load the server settings.
        // Override the value of Tasket.settings with the
        // values returned from the server
        this.init(app._cacheServerSettings());
    }
});
