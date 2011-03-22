
var dummyCode = false,
    cachedCode = false,
    debugUsername = "TestUser",
    debugPassword = "12345",
    notification = app.notification,
    lang = Tasket.lang.en,
    dashboard = new Dashboard();

$('body').append(dashboard.el);



/////

app.setupAuthentication();

if (!app.authtoken){
    // Pass this into our bootstrap method as the app depends on
    // on the user beign logged in.
    app.init(Tasket.login(debugUsername, debugPassword, function(data){
        var user, tasks, hubs;

        // Update current user details.
        app.authtoken = data.sessionid;
        user = app.currentUser = new User(data.user);

        user.set({statistics: {
            claimed: 2,
            done: 4,
            approved: 12
        }});

        // Fire an event to notify listeners the current user has changed.
        app.updateCurrentUser(user);

        // Update the dashboard with the current user.
        dashboard.setUser(user).render();

        // Fetch the users tasks and hubs. Then once they've been added to the cache
        // update the Dashboard with the details.
        tasks = _.flatten(
            app.currentUser.get('tasks').owned,
            app.currentUser.get('tasks').claimed
        );
        Tasket.fetchAndAdd(tasks, Tasket.tasks, function () {
            // Update the dashboard.
            dashboard.updateUserTasks().updateManagedTasks();
        });

        hubs = app.currentUser.get('hubs').owned;
        Tasket.fetchAndAdd(hubs, Tasket.hubs, function () {
            dashboard.updateUserHubs();
        });
    }));

    // TODO: cache authtoken in localStorage (but expire it after some time)
    // TODO: handle authtoken failure by logging in and repeating requests - need an abstract api() method?
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


// TODO: TEMP
if (dummyCode){
    drawDummyData();
}
else {
    // TODO: TEMP
    if (cachedCode){
        useCachedData();
    }

    /////

    // Timeout required to prevent notification appearing immediately (seen in Chrome)
    window.setTimeout(function(){
        notification.warning(lang.LOADING);
    }, 0);

    // TODO: setTimeout in case of non-load -> show error and cancel all open xhr

    // Run setup methods.
    app.setupToolbar();

    // START
    app.init();
}


/////     /////     /////     /////     /////     /////     /////


function useCachedData(){
    Tasket.endpoint = "example-data/";

    Model.url = Hub.url = Task.url = User.url = function() {
        var url = Tasket.endpoint + this.type + "s";
        return this.isNew() ?
            url + ".json" : url + this.id + ".json";
    };

    CollectionModel.url = HubList.url = TaskList.url = UserList.url = Tasket.hubs.url = Tasket.tasks.url = Tasket.users.url = function(){
        var url = Tasket.endpoint + this.type + "s";
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        // TODO: find out why tasks pluck is in two arrays
        return url + ".json?ids=" + this.pluck("id").sort();
    }
}


/////     /////     /////     /////     /////     /////     /////


function drawDummyData(){
    notification.hide();

    var myHub = new Hub({
            title: "Foo foo foo",
            description: "Lorem ipsum",
            image: "media/images/placeholder.png",
            owner: "5"
        }),

        myHubView = new HubView({
            model: myHub,

            // options
            selected: true,
            offset: {
                top: 300,
                left: 500
            },

            collection: new TaskList([ // TODO: add these to the hub, not the hubview
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Another User',
                        url: '#/user/another-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub, // TODO: how does this align with a JSON representation, using the id?
                    hasUser: true,
                    isOwner: false,
                    isNotOwner: true,
                    showTakeThisButton: false,
                    showDoneThisButton: false
                },
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Current User',
                        url: '#/user/current-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub,
                    hasUser: true,
                    isOwner: true,
                    isNotOwner: false,
                    showTakeThisButton: false,
                    showDoneThisButton: true
                },
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Current User',
                        url: '#/user/current-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub,
                    hasUser: false,
                    isOwner: false,
                    isNotOwner: true,
                    showTakeThisButton: true,
                    showDoneThisButton: false
                }
            ])
        });

        jQuery("body").append(myHubView.elem);
        myHubView.render();
}
