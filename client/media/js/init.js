var dummyCode = false,
    cachedCode = false,
    debugUsername = "TestUser",
    debugPassword = "12345", // "12345"
    notification = app.notification,
    lang = Tasket.lang.en;

$('body')
  .append(app.dashboard.render().el)
  .append(app.lightbox.render().hide().el);

// Return to the previous route when the lightbox closes.
app.lightbox.bind('hide', app.back);
app.bind('change:currentUser', _.bind(app.dashboard.setUser, app.dashboard));
app.dashboard.detail.bind('hide', app.back);

/////

app.setupAuthentication();

if (!app.authtoken){
    if (debugUsername && debugPassword) {
        // Pass this into our bootstrap method as the app depends on
        // on the user beign logged in.
        app.init(Tasket.login(debugUsername, debugPassword, function(data){
            var user, tasks, hubs;

            // Update current user details.
            app.authtoken = data.sessionid;
            user = app.currentUser = new User(data.user);

            // Fire an event to notify listeners the current user has changed.
            app.updateCurrentUser(user);

            // Fetch the users tasks and hubs. Then once they've been added to the cache
            // update the Dashboard with the details.
            tasks = _.flatten(
                app.currentUser.get('tasks.owned.done'),
                app.currentUser.get('tasks.claimed.claimed')
            );
            Tasket.fetchAndAdd(tasks, Tasket.tasks, function () {
                // Update the dashboard.
                app.dashboard.updateUserTasks().updateManagedTasks();
            });

            hubs = app.currentUser.get('hubs.owned');
            Tasket.fetchAndAdd(hubs, Tasket.hubs, function () {
                app.dashboard.updateUserHubs();
            });
        }));

        // TODO: cache authtoken in localStorage (but expire it after some time)
        // TODO: handle authtoken failure by logging in and repeating requests - need an abstract api() method?
    }
}

// Get data from the server and draw.
app.init(function () {
    // Create a new jQuery deferred object to be returned to init().
    var deferred = new jQuery.Deferred();

    // Pass a callback to the getOpenHubs() method that updates our
    // deferred with the status. We call resolve() if the hubs have
    // loaded and reject() if there was an error.
    Tasket.getOpenHubs(function (success) {
        if (success === true) {
            deferred.resolve();
        } else {
            notification.error(lang.DOWNLOAD_ERROR);
            deferred.reject();
        }
    });

    // Return our deferred to the app.init() method.
    return deferred;
}());

/////

// Called when the app has all dependancies loaded.
app.bind("ready", function onReady(){
    notification.hide();
    app.tankController.addHubs(Tasket.hubs.models);
    Backbone.history.start();
});

// Called when the bootstrap methods fail.
app.bind("error", function (data) {
    // Any global error handling.
});


/////


// Timeout required to prevent notification appearing immediately (seen in Chrome)
window.setTimeout(function(){
    notification.warning(lang.LOADING);
}, 0);

// TODO: setTimeout in case of non-load -> show error and cancel all open xhr

// Run setup methods.
app.setupToolbar();
app.updateCurrentUser(null);
// START
app.init();
