// DEV VERSION OF tasket.js
// The production version will be built with concatenated, minfied scripts.

// **

// Detect debug mode
// To enter debug mode, add ?debug to the URL (before the #hash), e.g. http://localhost:8000/?debug#/hubs/13/

(function(){
    "use strict";
    
    var tasketDebug = /^\?debug[\W\/]?/.test(window.location.search);
    
    // PRODUCTION MODE
    if (!tasketDebug){
        // Load production mode scripts
        
        // http://code.jquery.com/jquery-1.6.1.min.js
        getScript("media/js/build/pkg/tasket.all.min.js");
    }

    // DEVELOPMENT/ DEBUG MODE
    else {
        window.tasketDebug = true;
        
        // Console logging
        window.O = function(){
            if (window.console){
                window.console.log.apply(window.console, arguments);
            }
        };
            
        // **
        
        // Development/debugging mode scripts
        getScript(
            // Each array contains scripts that don't depend on each other.
            // Each successive argument contains a script or scripts that are dependent on the previous argument.
            [
                "dependencies/jquery.js", // TODO: update jQuery to latest
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
            "viz/forcedirector.js",
            "views/views.js",
            "controllers/controllers.js",
            
            [
                "models/hub.js",
                "models/task.js",
                "models/user.js",
                "viz/forcedirector.backbone.js",
                "views/toolbar.js",
                "views/hub-view.js",
                "views/task-view.js",
                "views/notification.js",
                "views/lightbox.js",
                "views/dashboard.js",
                "views/form.js"
            ],
            "views/form-upload.js",
            [
                "views/login.js",
                "views/change-password.js",
                "views/forgot-details.js",
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
            "viz/test-forcedirector.js",
            
            // Callback function once all are loaded
            function(loaded){
                if (!loaded){
                    throw "Scripts not fully loaded";
                }
            },
            
            // Options (path is relative to the calling HTML file)
            {path:"media/js/", bustCache:true}
        );
    }
}());
