var Notification = Backbone.View.extend({
    tagName: "div",

    className: "notification",

    events: {
        'click .close': 'hide'
    },

    initialize: function () {
        this.elem = $(this.el);
        this.render();
        this.contentElem = this.elem.find(".notification-content");
        body.prepend(this.elem);
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
        
        $(window).bind('keyup', this._onKeyPress);
        $(document.body).addClass('show-notification');
        return this;
    },

    hide: function () {
        $(window).unbind('keyup', this._onKeyPress);
        $(document.body).removeClass('show-notification');
        return this;
    },
    
    success: function (message) {
        return this.show(message, Notification.status.SUCCESS);
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
