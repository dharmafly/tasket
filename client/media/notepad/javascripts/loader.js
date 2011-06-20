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


            // models
            jsCorePath + '/models/models.js',
            jsCorePath + '/models/task.js',
            jsCorePath + '/models/hub.js',
            jsCorePath + '/models/user.js',

            // views
            //jsClientPath + '/views/task.js',
            jsCorePath + '/views/views.js',
            jsCorePath + '/views/lightbox.js',
            
            jsClientPath + '/views/task.js',
            jsClientPath + '/views/task-list.js',
            jsClientPath + '/views/task-form.js',

            // controllers
            jsClientPath + '/controllers/task.js',


            //core

            jsCorePath + '/core/core.js',
            jsCorePath + '/core/tasket.js',
            jsCorePath + '/app.js',
            jsClientPath + '/notepad.js',



            function done(allLoaded) {
                if (!allLoaded) {
                    throw new Error("Not all scripts have been loaded");
                } else {
                    notepad.bootstrap();
                }
            },

        {noCache: true});
    });




}).call(window, document, jQuery, undefined);
