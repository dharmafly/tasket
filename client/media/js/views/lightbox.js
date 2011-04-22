var Lightbox = View.extend({
    events: {
        "click": "_onHide"
    },

    tagName: "section",

    className: "lightbox",

    classes: {
        display: "show",
        animate: "fade-in"
    },

    constructor: function Lightbox() {
        View.prototype.constructor.apply(this, arguments);
    },
    show: function (options) {
        this.elem.addClass(this.classes.display);

        // Need to use a timer for the animation to trigger.
        setTimeout(_.bind(function () {
            this.elem.addClass(this.classes.animate);
        }, this), 0);

        this._updateMargin();

        return this.trigger(options, "show", this);
    },
    hide: function (options) {
        var duration = this.elem.css("transition-duration") ||
            this.elem.css("-moz-transition-duration") ||
            this.elem.css("-webkit-transition-duration") ||
            this.elem.css("-o-transition-duration") ||
            this.elem.css("-ms-transition-duration") ||
            0;
            
        this.elem.removeClass(this.classes.animate);
        if (duration) {
            setTimeout(_.bind(function () {
                this.elem.removeClass(this.classes.display);
            }, this), parseFloat(duration) * 1000);
        } else {
            this.elem.removeClass(this.classes.display);
        }

        return this._trigger(options, "hide", this);
    },
    content: function (content) {
        var element = this.$(".content");
        if (typeof content === "string") {
            element.html(content);
        } else {
            element.empty().append(content);
        }
        return this;
    },
    render: function () {
        var template = tim("lightbox");
        this.elem.html(template);
        return this;
    },
    _updateMargin: function () {
        var inner = this.$(".lightbox-inner");
        inner.css({
            top: "50%",
            "margin-top": inner.outerHeight() / 2 * -1
        });
        return this;
    },
    _trigger: function () {
      var options = arguments[0] || {},
          args = Array.prototype.slice.call(arguments, 1);

      if (!options.silent) {
        this.trigger.apply(this, args);
      }

      return this;
    },
    _onHide: function (event) {
        if (event.target.nodeName === "A"){
            this.hide({silent:true});
        }
    
        else if (event.target === this.el || jQuery(event.target).hasClass("close")) {
            event.preventDefault();
            this.hide();
        }
    }
});

