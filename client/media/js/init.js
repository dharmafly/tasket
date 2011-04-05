var dummyCode = false,
    cachedCode = false,
    debugUsername = "TestUser",
    debugPassword = "", // "12345"
    lang = Tasket.lang.en;

$('body')
  .append(app.dashboard.render().el)
  .append(app.lightbox.render().hide().el);

// Return to the previous route when the lightbox closes.
app.lightbox.bind('hide', app.back);
app.bind('change:currentUser', _.bind(app.dashboard.setUser, app.dashboard));
app.dashboard.detail.bind('hide', app.back);

/////


// Run setup methods.
app.setupToolbar(); // TODO: move setupToolbar to app object from the start and create toolbar view

app.restoreCache()
   .setupAuthentication();

if (!app.authtoken){
    if (debugUsername && debugPassword) {
        // Pass this into our bootstrap method as the app depends on
        // on the user beign logged in.
        app.init(Tasket.login(debugUsername, debugPassword, function(data){

            // Update current user details & fire an event to notify listeners the current user has changed.
            app.setAuthtoken(data.sessionid);
            app.updateCurrentUser(new User(data.user));
        }));

        // TODO: cache authtoken in localStorage (but expire it after some time)
        // TODO: handle authtoken failure by logging in and repeating requests - need an abstract api() method?
    }
}

// Bootstrap the app with all open hubs.
app.init(jQuery.ajax({
    url: "/hubs/",
    success: function (json) {
        Tasket.hubs.add(json);
    },
    error: function () {
        app.notification.error(lang.DOWNLOAD_ERROR);
    }
}));

/////

// Called when the app has all dependancies loaded.
app.bind("ready", function onReady(){
    app.notification.hide();
    app.tankController.addHubs(Tasket.hubs.models);

    // Destory the cached user details when the logout button is clicked.
    // This block can be removed once Ticket #84 has been resolved and the
    // server deletes the "sessionid" cookie on logout.
    $('form[action="/logout/"]').submit(function (event) {
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
    $("[data-task-state][data-task-id]").live("click", function () {
        var button = $(this),
            state = button.data('task-state'),
            id = button.data('task-id'),
            task;

        task = Tasket.getTasks([id]).at(0);
        if (task && state) {
            task.state(state, app.currentUser.id).save();
        }
    });

    Backbone.history.start();
    app.loaded = true;
});

// Called when the bootstrap methods fail.
app.bind("error", function (data) {
    app.notification.error(lang.INIT_ERROR);
});


/////


// Timeout required to prevent notification appearing immediately (seen in Chrome)
window.setTimeout(function(){
    if (!app.loaded){
        app.notification.warning(lang.LOADING);
    }
}, 0);

// TODO: setTimeout in case of non-load -> show error and cancel all open xhr

// START
app.init();
