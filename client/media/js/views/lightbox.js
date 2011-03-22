var Lightbox = View.extend({
    events: {
        'click': '_onHide'
    },

    tagName: 'section',

    className: 'lightbox',

    classes: {
        display: 'show',
        animate: 'fade-in'
    },

    constructor: function Lightbox() {
        View.prototype.constructor.apply(this, arguments);
    },
    show: function () {
        this.elem.addClass(this.classes.display);

        // Need to use a timer for the animation to trigger.
        setTimeout(_.bind(function () {
            this.elem.addClass(this.classes.animate);
        }, this), 0);

        return this.trigger('show');
    },
    hide: function () {
        var duration = this.elem.css('-webkit-transition-duration') || null;

        this.elem.removeClass(this.classes.animate);
        if (duration) {
            setTimeout(_.bind(function () {
                this.elem.removeClass(this.classes.display);
            }, this), duration * 1000);
        } else {
            this.elem.removeClass(this.classes.display);
        }

        return this.trigger('close');
    },
    content: function (content) {
        var element = this.$('.content');
        if (typeof content === 'string') {
            element.html(content);
        } else {
            element.empty().append(content);
        }
        return this;
    },
    render: function () {
        var template = tim('lightbox');
        this.elem.html(template);
        return this;
    },
    _onHide: function (event) {
        if (event.target === this.el || $(event.target).hasClass('close')) {
            event.preventDefault();
            this.hide();
        }
    }
});

