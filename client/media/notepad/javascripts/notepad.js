<<<<<<< Updated upstream
// notepad.js is the Notepad app's specific app.js
// TODO: more tank-related functionality out of app.js and into tank.js

var notepad = _.extend({
    setup: function () {
    },
    
    _setupLightbox: function(){
        var lightbox = app.lightbox = new Lightbox();
        app.bodyElem.append(lightbox.render().el);
        
        // Return to the previous route when the lightbox closes
        lightbox.bind("hide", function(){
            app.back(lightbox.historyCount);
        });
    },
=======
var notepad = _.extend({

        selectedHub: null,

        setup: function () {
        },

        bootstrap: function () {
            var taskController = new TaskController();
>>>>>>> Stashed changes

    bootstrap: function () {
        app.bodyElem = jQuery("body"); // TODO: Lightbox and others looks for app.bodyElem (App should be a class)
        this.controller = new TaskController();
        app.accountController = new AccountController();
        this._setupLightbox();
        
        // If user lands on root update the url to "/#/" for consistency. This
        // can be removed should the history API be implemented.
        if (!window.location.hash) {
            window.location.hash = "/";
        }
        Backbone.history.start();
    }

}, app);

