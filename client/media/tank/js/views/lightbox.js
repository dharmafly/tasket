var Lightbox = View.extend({
    events: {
        "click": "_onHide"
    },

    tagName: "div",

    className: "lightbox",

    classes: {
        display: "show",
        animate: "fade-in"
    },
    
    // The default step back in history to revert to when the lightbox closes
    historyCount: 1,

    constructor: function Lightbox() {
        View.prototype.constructor.apply(this, arguments);
        _.bindAll(this, '_onKeypress');
    },
    
    show: function (options) {
        this.elem.addClass(this.classes.display);

        // Need to use a timer for the animation to trigger.
        setTimeout(_.bind(function () {
            this.elem.addClass(this.classes.animate);
        }, this), 0);

        this._updateMargin();
        
        // If contents is a form, then focus its first control
        this.$(":input:first").focus();

        // Listen for escape key to close.
        jQuery(document).one('keydown', this._onKeypress);

        return this.trigger("show", options, this);
    },
    
    hide: function (options) {
        var duration = this.elem.css("transition-duration") ||
            this.elem.css("-moz-transition-duration") ||
            this.elem.css("-webkit-transition-duration") ||
            this.elem.css("-o-transition-duration") ||
            this.elem.css("-ms-transition-duration") ||
            0;
        
        // Put control in the main body, and away from the lightbox's contents (amongst other things, this will close the keyboard on an iPhone/iPad when the lightbox previously contained a form that the user submitted)
        app.bodyElem.focus();
            
        this.elem.removeClass(this.classes.animate);
        if (duration) {
            setTimeout(_.bind(function () {
                this.elem.removeClass(this.classes.display);
            }, this), parseFloat(duration) * 1000);
        }
        else {
            this.elem.removeClass(this.classes.display);
        }
        
        jQuery(document).unbind('keydown', this._onKeypress);
        
        this._trigger(options, "hide", this);
        this.historyCount = 1;
        return this;
    },
    
    isHidden: function () {
        return !this.elem.hasClass(this.classes.display);
    },
    
    // Custom lightbox types - a type can be passed to the content() method below
    _lightboxTypes: {},
    
    // Insert content into lightbox
    content: function (content, lightboxType) { // content = html, text or element; lightboxType = className to add to lightbox elem
        var elem = this.elem,
            contentElem = this.$(".content");
        
        _.each(this._lightboxTypes, function(value, lightboxType){
            elem.removeClass(lightboxType);
        });
        
        if (lightboxType) {
            this._lightboxTypes[lightboxType] = true;
            elem.addClass(lightboxType);
        }
        
        // Plain text or HTML
        if (typeof content === "string") {
            contentElem.html(content);
        }
        // Element or jQuery wrapped element
        else {
            contentElem.empty().append(content);
        }
        return this._updateMargin();
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
        var target = jQuery(event.target),
            hash   = (target.prop("hash") || '').slice(1);

        // A normal close lightbox click
        if (event.target === this.el || target.hasClass("close") || hash === "close") {
            event.preventDefault();
            this.hide();
        }
        // Links from the lightbox contents shouldn't trigger an auto rewind of history when clicked on
        else if (event.target.nodeName === "A"){
            // A link to a new lightbox, from within a lightbox. Use the HTML attribute `data-lightbox="open` to prevent history rewind
            if (event.target.getAttribute("data-lightbox") === "open"){
                app.lightbox.historyCount ++;
            }
            // A link to content outside of the lightbox
            else {
                this.hide({silent:true});
            }
        }
    },

    _onKeypress: function (event) {
        if (event.which === 27 /* escape key*/) {
            this.hide();
        }
    }
});

