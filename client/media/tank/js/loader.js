/* TASKET LOADER
    In development, you can skip the loader by loading the minified, built app directly.
    
    The advantage of the loader is that it allows you to add `?debug` to the URL in the browser address bar, to load each full JS file separately, for development and debugging.

    To enter debug mode, add ?debug to the URL (before the #hash), e.g. http://localhost:8000/?debug#/hubs/13/
*/
(function(window, getScript){
    "use strict";
    
    var windowSearch = window.location.search,
        // Detect debug mode
        debug = /^\?debug[\W\/]?/.test(windowSearch),
        debugForceDirector = debug && /debugForceDirector/i.test(windowSearch); // case-insensitive match of "debugforcedirector"
    
    // PRODUCTION MODE
    if (!debug){
        // Load production mode scripts
        getScript("/media/tank/build/pkg/tasket.tank.min.js?0.0.3");
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
                "lib/js/jquery.js", // TODO: update jQuery to latest
                "lib/js/cache.js",
                "lib/js/underscore.js",
                "lib/js/tim.js"
            ],
            
            "lib/js/jquery.hashchange.js",
            "lib/js/vec2.js",
            "lib/js/forcedirector.js",

            "lib/js/backbone.js",
            "lib/js/flatten.js",
            "tank/js/backbone-stack.js",
            "tank/js/core/utils.js",
            "tank/js/core/mixins.js",
            "tank/js/models/models.js",
            "tank/js/viz/forcedirector.js",
            "tank/js/views/views.js",
            "tank/js/controllers/controllers.js",
            "tank/js/controllers/tank-controller.js",
            "tank/js/controllers/account-controller.js",
            "tank/js/controllers/dashboard-controller.js",
            [
                "tank/js/models/hub.js",
                "tank/js/models/task.js",
                "tank/js/models/user.js",
                "tank/js/viz/forcedirector.backbone.js",
                "tank/js/views/tank.js",
                "tank/js/views/toolbar.js",
                "tank/js/views/hub-view.js",
                "tank/js/views/task-view.js",
                "tank/js/views/notification.js",
                "tank/js/views/lightbox.js",
                "tank/js/views/dashboard.js",
                "tank/js/views/form.js",
                "tank/js/views/hub-marker.js",
                "tank/js/views/hub-markers.js"
            ],
            "tank/js/views/form-upload.js",
            [
                "tank/js/views/login.js",
                "tank/js/views/change-password.js",
                "tank/js/views/forgot-details.js",
                "tank/js/views/signup.js",
                "tank/js/views/archive-form.js",
                "tank/js/views/task-form.js",
                "tank/js/views/hub-form.js",
                "tank/js/views/dashboard-detail.js"
            ],
            [
                "tank/js/views/dashboard-detail-hub.js",
                "tank/js/views/account.js"
            ],
            "tank/js/core/tasket.js",
            "tank/js/app.js",
            "tank/js/lang/default.js",
            "tank/js/lang/custom.js",
            "tank/js/init.js",
    
            // TESTS        
            [
                debugForceDirector ? "tank/js/viz/test-forcedirector.js" : ""
            ],
            
            // Callback function once all are loaded
            function(allLoaded){
                if (!allLoaded){
                    throw "Scripts not fully loaded";
                }
            },
            
            // Options (path is relative to the calling HTML file)
            {path:"/media/", noCache:true}
        );
    }
}(this, getScript));
