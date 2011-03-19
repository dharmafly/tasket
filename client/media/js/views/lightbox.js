var Lightbox = View.extend({
    events: {
        'click': '_onHide'
    },
    classes: {
        display: 'show',
        animate: 'fade-in'
    },
    initialize: function(){
        View.prototype.initialize.apply(this, arguments);

        // All lightbox classes share the same lightbox element.
        this.elem = $('.lightbox');
        this.el = this.elem[0];
        this.content = this.$('.content');

        // Bind the callbacks to the current scope.
        _.bind(this._onHide, this);

        // Delegate events on the .lightbox
        this.delegateEvents();
    },
    show: function () {
        this.elem.addClass(this.classes.display);

        // Need to use a timer for the animation to trigger.
        setTimeout(_.bind(function () {
            this.elem.addClass(this.classes.animate);
        }, this), 0);

        return this;
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

        return this;
    },
    render: function (html) {
        this.content.html(html);
        return this;
    },
    _onHide: function (event) {
        event.preventDefault();
        if (event.target === this.el || $(event.target).hasClass('close')) {
            this.hide();
        }
    }
});

