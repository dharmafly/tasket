// Handles display of hub markers.
var HubMarkers = View.extend({

    className: "hub-marker-container",

    /* Classes to change state. */
    classes: {
        fullscreen: "fullscreen"
    },

    /* Public: Initializes the HubMarkers view.
     *
     * options - An object literal containing config options.
     *
     * Returns nothing.
     */
    constructor: function HubMarkersView(options) {
        View.apply(this, arguments);

        bindHandlers(this);

        this.markers = {};        

        // Manually delegate events on Hub markers for performance. This can't
        // be done in the events property as we need the className.
        this.elem.on({
            click:      this._onClickMarker,
            mouseenter: this._onMouseEnterMarker,
            mouseleave: this._onMouseLeaveMarker
        }, '.' + HubMarker.prototype.className);
    },

    /* Public: Checks to see if the view is currently fullscreened.
     *
     * Examples
     *
     *   if (view.isFullscreen()) {
     *     // Do something.
     *   }
     *
     * Returns true if the view is fullscreen.
     */
    isFullscreen: function () {
        return this.elem.hasClass(this.classes.fullscreen);
    },

    /* Public: Makes the marker view take up the full viewport. Usually
     * called when the sidebar dashboard is hidden.
     *
     * If no fullscreen is provided it will toggle the fullscreen state.
     *
     * fullscreen - If true makes the view fullscreen (optional).
     *
     * Examples
     *
     *   if (dashboard.isHidden()) {
     *     view.toggleFullscreen(true);
     *   } else {
     *     view.toggleFullscreen(false);
     *   }
     *
     * Returns itself.
     */
    toggleFullscreen: function (fullscreen) {
        if (!arguments.length) {
            fullscreen = !this.isFullscreen();
        }
        this.elem.toggleClass(this.classes.fullscreen, fullscreen);
        return this;
    },

    /* Public: Adds a marker to the view for the Hub model provided. All
     * events fired by the MarkerHub are proxied.
     *
     * hub - A hub model to add.
     *
     * Examples
     *
     *   view.addMarker(hub);
     *
     * Returns itself.
     */
    addMarker: function (hub) {
        var marker = this.markers[hub.id] = new HubMarker({model: hub});
        this.elem.append(marker.render());
        return this._proxyEvents(marker);
    },

    /* Public: Show hide the marker for the provided hub.
     *
     * hub  - A hub model.
     * show - If true will show the marker, otherwise hides it (optional).
     *
     * Examples
     *
     *   view.toggleMarker(hub, true); // Show the marker for hub.
     *
     * Returns itself.
     */
    toggleMarker: function (hub, show) {
        var marker = this.markers[hub && hub.id],
            method = show === true ? 'show' : 'hide';

        if (marker) {
            marker[method]();
        }

        return this;
    },

    /* Public: Updates the position of a marker for the provided hub.
     * 
     * The angle argument should be an angle where 0 sits on the positive
     * x-axis. Rotation is counter clockwise.
     *
     * hub   - A hub model.
     * angle - The angle the marker is at from the center of the view.
     *
     * Examples
     *
     *   view.updateMarker(hub, Math.PI / 2);
     *
     * Returns itself.
     */
    updateMarker: function (hub, angle, scale) {
        var marker = this.markers[hub && hub.id];
        if (marker) {
            marker.position(this._calculatePosition(angle), angle).scale(scale);
        }
        return this;
    },

    /* Public: Gets a bounding object for the view. The object has properties
     * for width, height, top and left offsets.
     *
     * Examples
     *
     *   $("<div>").css(marker.getBounds());
     *
     * Returns a object reprresenting the views bounds.
     */
    getBounds: function () {
        return _.extend({
            width:  this.elem.width(),
            height: this.elem.height()
        }, this.elem.offset());
    },

    /* Calculates the top/left position of an element in a container based
     * upon the angle (in radians) from the center of the container. The
     * results are returned in percentages and can be passed directly into
     * jQuery#css().
     *
     * The radians argument should be an angle where 0 sits on the positive
     * x-axis. Rotation is counter clockwise.
     *
     * radians - The angle the marker is at relative to the viewport.
     *
     * Examples
     *
     *   // Assuming a square viewport:
     *
     *   var offset = view._calculatePosition(Math.PI / 4); // 45 degrees
     *   //=> {top: "0%", left: "100%"}
     *
     *   var offset = view._calculatePosition(Math.PI * 1.75); // 275 degrees
     *   //=> {top: "50%", left: "0%"}
     * 
     *   var offset = view._calculatePosition(Math.PI); // 180 degrees
     *   //=> {top: "100%", left: "50%"}
     *
     * Returns an object with top & left as percentages.
     */
    _calculatePosition: function (radians) {
        var width    = this.elem.width(),
            height   = this.elem.height(),
            x = width / 2, y = height / 2,
            scalarY, scalarX,
            PI = Math.PI,
            top = 0, left = 0;

        if (radians < PI / 2) { // First quadrant.
            scalarY = Math.tan(radians) * x;
            if (scalarY <= y) {
                top  = y - scalarY;
                left = width;
            } else {
                scalarX = Math.tan((PI / 2) - radians) * y;
                top  = 0;
                left = x + scalarX;
            }
        }
        else if (radians < PI) { // Second quadrant.
            radians = PI - radians;
            scalarY = Math.tan(radians) * x;
            if (scalarY <= y) {
                top  = y - scalarY;
                left = 0;
            } else {
                scalarX = Math.tan((PI / 2) - radians) * y;
                top  = 0;
                left = x - scalarX;
            }
        }
        else if (radians < (PI * 1.5)) { // Third quadrant.
            radians = radians - PI;
            scalarY = Math.tan(radians) * x;
            if (scalarY <= y) {
                top  = y + scalarY;
                left = 0;
            } else {
                scalarX = Math.tan((PI / 2) - radians) * y;
                top  = height;
                left = x - scalarX;
            }
        }
        else if (radians < (PI * 2)) { // Forth quadrant.
            radians = (2 * PI) - radians;
            scalarY = Math.tan(radians) * x;
            if (scalarY <= y) {
                top  = y + scalarY;
                left = width;
            } else {
                scalarX = Math.tan((PI / 2) - radians) * y;
                top  = height;
                left = x + scalarX;
            }
        }

        // Return widths in percentages to allow window to be resized.
        return {
            top:  ((top / height) * 100) + '%',
            left: ((left  / width)  * 100) + '%'
        };
    },

    /* Gets the view from the #markers objects for the element provided.
     *
     * element - A HubMarker DOM Element.
     *
     * Examples
     *
     *   var markerView = view._getViewByModelAttr(element);
     *   if (markerView) {
     *      // Do something.
     *   }
     *
     * Returns a HubMarker or undefined if not found.
     */
    _getViewByModelAttr: function (element) {
        var model = element.getAttribute('data-model') || "";
        return this.markers[model.split("-").pop()];
    },

    /* Click handler that handles clicks on child elements and triggers the
     * "selected" event passing in the selected view and itself to all
     * event handlers.
     *
     * event - A jQuery.Event click event.
     *
     * Examples
     *
     *   view.elem.on("click", markerClass, view._onClick);
     *
     * Returns nothing.
     */
    _onClickMarker: function (event) {
        var view = this._getViewByModelAttr(event.currentTarget);

        if (view) {
            // Trigger event on the child view. This will be proxied by the
            // current view and allows the click handler to be moved to the
            // child later if necessary.
            view.trigger("selected", view);
            event.preventDefault();
        }
    },

    /* Event handler that displays the tooltip for the marker on mouseover.
     *
     * Triggers the "mouseenter" event passing in the view to all handlers.
     *
     * event - A jQuery.Event mouse event.
     *
     * Returns nothing.
     */
    _onMouseEnterMarker: function (event) {
        var view = this._getViewByModelAttr(event.currentTarget);
        if (view) {
            view.trigger("mouseenter", view, this);
            view.showTooltip();
        }
    },

    /* Event handler that displays the tooltip for the marker on mouseout.
     *
     * Triggers the "mouseleave" event passing in the view to all handlers.
     *
     * event - A jQuery.Event mouse event.
     *
     * Returns nothing.
     */
    _onMouseLeaveMarker: function (event) {
        var view = this._getViewByModelAttr(event.currentTarget);
        if (view) {
            view.trigger("mouseleave", view, this);
            view.hideTooltip();
        }
    }
});

// Add show/hide methods to the view.
jQuery.extend(true, HubMarkers.prototype, mixins.proxy, mixins.toggle);
