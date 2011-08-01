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
        jsLibPath   = "lib/js/",
        jsCorePath  = "tank/js/",
        jsAppPath   = "notepad/js/";
    
    // PRODUCTION MODE
    if (!debug){
        // Load production mode scripts
        getScript("/media/notepad/build/pkg/tasket.notepad.min.js?0.0.1");
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
            // dependencies
            jsLibPath + "jquery.js",
            jsLibPath + "jquery.hashchange.js",
            jsLibPath + "cache.js",
            jsLibPath + "underscore.js",
            jsLibPath + "tim.js",
            jsLibPath + "backbone.js",
            jsCorePath + "backbone-stack.js",
            jsLibPath + "flatten.js",
            jsAppPath + "lib/jquery-ui.min.js",

            // models
            jsCorePath + "models/models.js",
            jsCorePath + "models/task.js",
            jsCorePath + "models/hub.js",
            jsCorePath + "models/user.js",

            // views
            jsCorePath + "views/views.js",
            jsCorePath + "views/lightbox.js",
            jsCorePath + "views/form.js",
            jsCorePath + "views/form-upload.js", // TODO: remove?

            jsCorePath + "views/signup.js",
            jsCorePath + "views/account.js",
            jsCorePath + "views/login.js",
            jsCorePath + "views/forgot-details.js",
            jsCorePath + "views/change-password.js",

            jsAppPath + "views/authbar.js",
            jsAppPath + "views/task.js",
            jsAppPath + "views/task-list.js",

            // controllers
            jsAppPath + "controllers/task-controller.js",
            jsCorePath + "controllers/account-controller.js",

            // core
            jsCorePath + "core/utils.js",
            jsCorePath + "core/tasket.js",
            jsCorePath + "app.js",
            jsAppPath + "notepad.js",
            jsAppPath + "lang/default.js",
            jsAppPath + "init.js",

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
