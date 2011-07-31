(function(window, jQuery){
    "use strict";
    
    var jsLibPath = "/media/lib/js/",
        jsCorePath = "/media/tank/js/",
        jsAppPath = "/media/notepad/js/";
    
    // Console logging for development
    window.O = function(){
        if (window.console){
            window.console.log.apply(window.console, arguments);
        }
    };

    // Use jQuery to load our own script loader
    jQuery.getScript( jsLibPath + "getscript.js", function () {
        // then load the app libraries
        window.getScript(

            // dependencies
            jsAppPath + "lib/json2.js",
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

            // Callback when all loaded
            function done(allLoaded) {
                if (!allLoaded) {
                    throw new Error("Not all scripts have been loaded");
                } else {
                    window.app.bootstrap();
                }
            },

            // Don't allow browser caching of files during development
            {noCache: true}
        );
    });
}(this, this.jQuery));
