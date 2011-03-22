// DEV VERSION OF tasket.js
// The production version will be built with concatenated, minfied scripts.

// **


// Console logging
function O(){
    if (window.console){
        window.console.log.apply(window.console, arguments);
    }
}

// **

getScript(
    // Each array contains scripts that don't depend on each other.
    // Each successive argument contains a script or scripts that are dependent on the previous argument.
    [
        "dependencies/jquery.js",
        "dependencies/underscore.js",
        "dependencies/tim.js"
    ],

    "dependencies/backbone.js",
    "core/core.js",
    "models/models.js",
    "views/views.js",
    
    [
        "models/hub.js",
        "models/task.js",
        "models/user.js",
        
        "views/hub-view.js",
        "views/task-view.js",
        "views/user-view.js",
        "views/notification.js",
        "views/lightbox.js",
        "views/dashboard.js",
        "views/dashboard-detail.js",
        "views/dashboard-detail-hub.js",
        "views/form.js",
        "views/signup.js",
        "views/login.js",
        "views/task-form.js",
        "views/hub-form.js",
        "controllers/controllers.js"
    ],
    
    [
        "core/tasket.js",
        "app.js"
    ],
    
    "lang/en.js",
    "views/toolbar.js",
    "init.js",
    "temp.js",
    
    // Callback function once all are loaded
    function(loaded){
        if (!loaded){
            throw "Scripts not fully loaded";
        }
    },
    
    // Options (path is relative to the calling HTML file)
    {path:"media/js/"}
);

