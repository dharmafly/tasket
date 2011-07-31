var Notification = Backbone.View.extend({
    tagName: "div",
    className: "notification",

    events: {
        'click .close': 'hide'
    },

    initialize: function () {
        this.elem = jQuery(this.el);
        this.render();
        this.contentElem = this.elem.find(".notification-content");
        app.bodyElem.prepend(this.elem);
        _.bindAll(this, "_onKeyPress");
    },

    render: function () {
        this.elem.html('<div class="notification-content"></div><button class="close">Close</button>');
        return this;
    },

    message: function (message) {
        this.contentElem.html(message);
        return this;
    },

    status: function (status) {
        var elem = this.elem,
            statuses = Notification.status;
        
        status = status || statuses.SUCCESS;
        
        if (!elem.hasClass(status)) {
            _(statuses).each(function (value) {
                elem.removeClass(value);
            });
            elem.addClass(status);
        }
        return this;
    },

    show: function (message, status) {
        if (!_.isUndefined(message)){
            this.message(message);
        }
        if (!_.isUndefined(status)){
            this.status(status);
        }
        
        jQuery(window).bind('keyup', this._onKeyPress);
        app.bodyElem.addClass('show-notification');
        return this;
    },

    hide: function () {
        jQuery(window).unbind('keyup', this._onKeyPress);
        app.bodyElem.removeClass('show-notification');
        return this;
    },
    
    success: function (message) {
        var hideDelay = app.successNotificationHideDelay,
            notification = this;
            
        this.show(message, Notification.status.SUCCESS);
        if (hideDelay){
            window.setTimeout(function(){
                notification.hide();
            }, hideDelay);
        }
        return this;
    },
    
    warning: function (message) {
        return this.show(message, Notification.status.WARNING);
    },
    
    error: function (message) {
        return this.show(message, Notification.status.ERROR);
    },

    _onKeyPress: function (event) {
        if (event.keyCode === 27) {
            this.hide();
        }
    }
});

Notification.status = {
    ERROR:   "error",
    WARNING: "warning",
    SUCCESS: "success"
};
