window.O = function(){
    if (window.console){
        window.console.log.apply(window.console, arguments);
    }
};


(function (document, $, undefined) {
    var jsCorePath = '/media/js',
        jsClientPath = '/media/notepad/javascripts';


    //use jQuery to load our own script loader
    $.getScript( jsCorePath + '/dependencies/getscript.js', function () {
        //then load the app libraries
        getScript(

            //dependencies

            jsCorePath + '/dependencies/underscore.js',
            jsCorePath + '/dependencies/backbone.js',
            jsCorePath + '/backbone-stack.js',
            jsCorePath + '/dependencies/cache.js',
            jsCorePath + '/dependencies/tim.js',
            jsCorePath + '/dependencies/flatten.js',
            jsClientPath + '/dependencies/jquery-ui.min.js',


            // models
            jsCorePath + '/models/models.js',
            jsCorePath + '/models/task.js',
            jsCorePath + '/models/hub.js',
            jsCorePath + '/models/user.js',

            // views
            //jsClientPath + '/views/task.js',
            jsCorePath + '/views/views.js',
            jsCorePath + '/views/lightbox.js',
            jsCorePath + '/views/form.js',
            jsCorePath + '/views/form-upload.js', // TODO: remove?

            jsCorePath + '/views/signup.js',
            jsCorePath + '/views/account.js',
            jsCorePath + '/views/login.js',
            jsCorePath + '/views/forgot-details.js',
            jsCorePath + '/views/change-password.js',

            jsClientPath + '/views/authbar.js',
            jsClientPath + '/views/task.js',
            jsClientPath + '/views/task-list.js',

            // controllers
            jsClientPath + '/controllers/task-controller.js',
            jsCorePath + '/controllers/account-controller.js',


            //core

            jsCorePath + '/core/core.js',
            jsCorePath + '/core/tasket.js',
            jsCorePath + '/app.js',
            jsClientPath + '/notepad.js',
            jsClientPath + '/lang/default.js',



            function done(allLoaded) {
                if (!allLoaded) {
                    throw new Error("Not all scripts have been loaded");
                } else {
                    app.bootstrap();
                }
            },

        {noCache: true});
    });




}).call(window, document, jQuery, undefined);
