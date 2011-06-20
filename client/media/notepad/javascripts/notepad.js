// notepad.js is the Notepad app's specific app.js
// TODO: more tank-related functionality out of app.js and into tank.js

var notepad = _.extend({
    setup: function () {
    },
    
    _setupLightbox: function(){
        var lightbox = this.lightbox = new Lightbox();
        app.bodyElem.append(lightbox.render().el);
    },

    bootstrap: function () {
        app.bodyElem = jQuery("body");
        this.controller = new TaskController();
        this._setupLightbox();
        Backbone.history.start();
    }

}, app);

