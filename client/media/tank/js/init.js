// Run after app properties have been setup.
app.bind("setup", function() {

    // BIND EVENTS

    // Return to the previous route when the lightbox closes
    app.lightbox.bind("hide", function(){
        app.back(app.lightbox.historyCount);
    });
    
    // Render views
    app.bodyElem
      .append(app.dashboard.el)
      .append(app.lightbox.render().el);

    // We must render after it's appended to the DOM so that the
    // height can be calculated.
    app.dashboard.render();
});

// Called when the app has all dependancies loaded.
app.bind("ready", function onReady () {
    app.notification.hide();
    app.tank.addHubs(Tasket.hubs.models);

    // Destroy the cached user details when the logout button is clicked.
    // This block can be removed once Ticket #84 has been resolved and the
    // server deletes the "sessionid" cookie on logout:
    // https://github.com/dharmafly/tasket/issues/84
    jQuery("form[action='/logout/']").submit(function (event) {
        app.destroyCache();
    });

    // Watch for button clicks that affect the state of tasks. These buttons
    // should have two attributes:
    //
    // data-task-state - The new task state.
    // data-task-id    - The id of the task to update.
    //
    // Example:
    //
    // <button data-task-state="verify" data-task-id="2">Verify Task</button>
    jQuery("[data-task-state][data-task-id]").live("click", function () {
        var button = jQuery(this),
            state = button.data("task-state"),
            id = button.data("task-id"),
            task;

        if (state === Task.states.CLAIMED) {
            if (!app.currentUser) {
                app.notification.error(
                    "Please <a href='#/login/'>login</a> to start claiming tasks"
                );
                return;
            }
            else if (!app.currentUser.canClaimTasks()) {
                app.notification.error(
                    "You cannot claim more than " + Tasket.settings.CLAIMED_LIMIT + " tasks at a time"
                );
                return;
            }
        }

        task = Tasket.getTasks([id]).at(0);
        if (task && state) {
            task.state(state, app.currentUser.id).save();
        }
    });

    // If user lands on root update the url to "/#/" for consistency. This
    // can be removed should the history API be implemented.
    if (!window.location.hash) {
        window.location.hash = "/";
    }

    // Need to restore the user from the cache once all the hubs are loaded.
    // This ensures that the users hubs are not requested before Tasket.hubs
    // is reset.
    app.restoreCache().setupAuthentication();

    Backbone.history.start();
});

// Called when the bootstrap methods fail.
app.bind("error", function (data) {
    app.notification.error(app.lang.INIT_ERROR);
});

if (app.isSupported()) {
    // Bootstrap the app with all open hubs.
    app.init(jQuery.ajax({
        url: "/hubs/",
        success: function (json) {
            Tasket.hubs.reset(json);
        },
        error: function () {
            app.notification.error(app.lang.DOWNLOAD_ERROR);
        }
    }));

    // Load the statistics url.
    app.init(app._cacheStatistics());
    
    // Load the server settings.
    // Override the value of Tasket.settings with the
    // values returned from the server
    app.init(app._cacheServerSettings());

    // Timeout required to prevent notification appearing immediately (seen in Chrome)
    window.setTimeout(function(){
        if (!app.loaded){
            app.notification.warning(app.lang.LOADING);
        }
    }, 0);

    // TODO: setTimeout in case of non-load -> show error and cancel all open xhr
    app.init();
}

else {
    (function () {

        // Display friendly unsupported message to the user.
        var lightbox = new Lightbox();
        app.bodyElem = jQuery("body")
            .find(":not(script)")
            .remove()
            .end()
            .append(lightbox.render().el);
        lightbox.content(tim("unsupported")).show();
    }());
}
