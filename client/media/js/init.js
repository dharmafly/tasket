// Run after app properties have been setup.
app.bind("setup", function() {

    // FORCE-DIRECTOR
    
    // Extend ForceDirector with event bindings
    _.extend(ForceDirector.prototype, Backbone.Events);
    
    // Override noop methods in ForceDirector prototype to allow triggering of events on loop start and end
    ForceDirector.prototype.triggerLoopStart = function(){
        this.trigger("start", this);
        app.tank.trigger("forcedirector:start", this);
    };
    
    ForceDirector.prototype.triggerLoopEnd = function(){
        this.trigger("end", this);
        app.tank.trigger("forcedirector:end", this);
    };
    
    ForceDirector.prototype.triggerLoop = function(){
        this.trigger("loop", this);
        app.tank.trigger("forcedirector:loop", this);
    };
            
    /////

    // BIND EVENTS

    // Return to the previous route when the lightbox closes
    app.lightbox.bind("hide", function(){
        app.back(app.lightbox.historyCount);
    });
    
    // Render views
    app.bodyElem
      .append(app.dashboard.render().el)
      .append(app.lightbox.render().el);
});

// Called when the app has all dependancies loaded.
app.bind("ready", function onReady () {
    app.notification.hide();
    app.tankController.addHubs(Tasket.hubs.models);

    // Destroy the cached user details when the logout button is clicked.
    // This block can be removed once Ticket #84 has been resolved and the
    // server deletes the "sessionid" cookie on logout:
    // https://github.com/premasagar/tasket/issues/84
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

if (app.supported()) {
    // Bootstrap the app with all open hubs.
    app.init(jQuery.ajax({
        url: "/hubs/",
        success: function (json) {
            Tasket.hubs.refresh(json);
        },
        error: function () {
            app.notification.error(app.lang.DOWNLOAD_ERROR);
        }
    }));

    // Load the statistics url.
    app.init(jQuery.ajax({
        url: Tasket.endpoint + "statistics/",
        dataType: "json",
        success: function (json) {
            _.each(json.tasks, function (value, key) {
                json.tasks[key] = parseInt(value, 10);
            });
            app.statistics = json;
            app.trigger("change:statistics", app.statistics, app);
        }
    }));

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
        jQuery("body")
            .find(":not(script)")
            .remove()
            .end()
            .append(lightbox.render().el);
        lightbox.content(tim("unsupported")).show();
    }());
}
