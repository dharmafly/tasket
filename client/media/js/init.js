// Bootstrap the app with all open hubs.
app.init(jQuery.ajax({
    url: "/hubs/",
    success: function (json) {
        Tasket.hubs.refresh(json);
    },
    error: function () {
        app.notification.error(Tasket.lang.en.DOWNLOAD_ERROR);
    }
}));

// Run after app properties have been setup.
app.bind("setup", function onSetup() {
    // Setup the app.
    jQuery('body')
      .append(app.dashboard.render().el)
      .append(app.lightbox.render().hide().el);

    // Return to the previous route when the lightbox closes.
    app.lightbox.bind('hide', app.back);
    app.bind('change:currentUser', _.bind(app.dashboard.setUser, app.dashboard));
    app.dashboard.detail.bind('hide', app.back);

    app.restoreCache()
       .setupAuthentication();
});

// Called when the app has all dependancies loaded.
app.bind("ready", function onReady () {
    app.notification.hide();
    app.tankController.addHubs(Tasket.hubs.models);

    // Destory the cached user details when the logout button is clicked.
    // This block can be removed once Ticket #84 has been resolved and the
    // server deletes the "sessionid" cookie on logout.
    jQuery('form[action="/logout/"]').submit(function (event) {
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
            state = button.data('task-state'),
            id = button.data('task-id'),
            task;

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

    Backbone.history.start();
});

// Called when the bootstrap methods fail.
app.bind("error", function (data) {
    app.notification.error(Tasket.lang.INIT_ERROR);
});


/////


// Timeout required to prevent notification appearing immediately (seen in Chrome)
window.setTimeout(function(){
    if (!app.loaded){
        app.notification.warning(Tasket.lang.en.LOADING);
    }
}, 0);

// TODO: setTimeout in case of non-load -> show error and cancel all open xhr

// START
app.init();
