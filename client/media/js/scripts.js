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
        "dependencies/cache.js",
        "dependencies/underscore.js",
        "dependencies/tim.js"
    ],
    
    "dependencies/vec2.js",
    "dependencies/forcedirector.js",

    "dependencies/backbone.js",
    "dependencies/flatten.js",
    "backbone-stack.js",
    "core/core.js",
    "models/models.js",
    "views/views.js",
    
    [
        "models/hub.js",
        "models/task.js",
        "models/user.js",
        "views/toolbar.js",
        "views/hub-view.js",
        "views/task-view.js",
        "views/notification.js",
        "views/lightbox.js",
        "views/dashboard.js",
        "views/form.js",
        "controllers/controllers.js"
    ],
    "views/form-upload.js",
    [
        "views/login.js",
        "views/signup.js",
        "views/task-form.js",
        "views/hub-form.js",
        "views/dashboard-detail.js"
    ],
    [
        "views/dashboard-detail-hub.js",
        "views/account.js"
    ],
    "core/tasket.js",
    "app.js",
    "lang/default.js",
    "lang/custom.js",
    "init.js",
    
    //"viz/forcedirector-gui/js/jquery-ui-1.8.4.custom.min.js",
    //"viz/forcedirector-gui/js/vector_battle_regular.typeface.js",
    //"viz/forcedirector-gui/data/tasket_data.js",
    
    // Callback function once all are loaded
    function(loaded){
        if (!loaded){
            throw "Scripts not fully loaded";
        }
        else {
            //var s = document.createElement("script");
            //s.setAttribute("data-main", "/media/js/viz/forcedirector-gui/scripts/main");
            //s.src = "/media/js/viz/forcedirector-gui/scripts/require.js";
            //document.head.appendChild(s);
        }
    },
    
    // Options (path is relative to the calling HTML file)
    {path:"media/js/", bustCache:true}
);

