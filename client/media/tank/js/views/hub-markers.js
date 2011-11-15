// Handles display of hub markers.
var HubMarkers = View.extend({

    className: "hub-marker-container",

    /* Public: Initializes the HubMarkers view.
     *
     * options - An object literal containing config options.
     *
     * Returns nothing.
     */
    constructor: function HubMarkersView(options) {
        View.apply(this, arguments);

        _.bindAll(this, "_onClick", "_onMouseEnterMarker", "_onMouseLeaveMarker");

        // Manually delegate clicks on Hub markers for performance. This can't
        // be done in the events property as we need the className.
        var markerClass = '.' + HubMarker.prototype.className;
        this.elem.on({
            click:      this._onClickMarker,
            mouseenter: this._onMouseEnterMarker,
            mouseleave: this._onMouseLeaveMarker
        }, markerClass);
        this.markers = {};
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
     * hub     - A hub model.
     * degrees - The angle the marker is at from the center of the view.
     *
     * Examples
     *
     *   view.updateMarker(hub, 36);
     *
     * Returns itself.
     */
    updateMarker: function (hub, degrees) {
        var marker = this.markers[hub && hub.id];
        if (marker) {
            marker.position(this._calculatePosition(degrees), degrees);
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
     * apon the angle (in degrees) from the center of the container. The
     * results are returned in percentages and can be passed directly into
     * jQuery#css().
     *
     * degrees - The angle the marker is at (0 degrees is north).
     *
     * Examples
     *
     *   var offset = view._calculatePosition(45);
     *   //=> {top: "0%", left: "100%"}
     *
     *   var offset = view._calculatePosition(270);
     *   //=> {top: "50%", left: "0%"}
     * 
     *   var offset = view._calculatePosition(180);
     *   //=> {top: "100%", left: "50%"}
     *
     * Returns an object with top & left as percentages.
     */
    _calculatePosition: function (degrees) {
        // TODO: Refactor this into nicer logic.
        var width  = this.elem.width(),
            height = this.elem.height(),
            top = 0, left = 0.5;

        // The container is divided into four segments, NE, SE, SW, NW for
        // each angle we check to see where in the grid the angle falls. For
        // example if it's 35deg we know that it will fall in the NE block and
        // top will be 0 so we calculate the left offset from the central
        // point and add 0.5 for the NW offset.
        //
        // I'm certain there are much more efficient and mathematically
        // correct ways of doing this so please refactor at will.
        if (degrees < 45) {
            top  = 0;
            left = 0.5 + this._getOffset(degrees);
        }
        else if (degrees <= 90) {
            left = 1;
            top  = this._getOffset(degrees - 45);
        }
        else if (degrees < 135) {
            left = 1;
            top  = 0.5 + this._getOffset(degrees - 90);
        }
        else if (degrees <= 180) {
            top  = 1;
            left = 1 - this._getOffset(degrees - 135);
        }
        else if (degrees < 225) {
            left = 0.5 - this._getOffset(degrees - 180);
            top  = 1;
        }
        else if (degrees <= 270) {
            left = 0;
            top  = 1 - this._getOffset(degrees - 225);
        }
        else if (degrees < 315) {
            top  = 0.5 - this._getOffset(degrees - 270);
            left = 0;
        }
        else if (degrees <= 360) {
            top  = 0;
            left = this._getOffset(degrees - 315);
        }

        // Return widths in percentages to allow window to be resized.
        return {
            top:  ((top  * height / height) * 100) + '%',
            left: ((left * width  / width)  * 100) + '%'
        };
    },

    _getOffset: function (degrees) {
        return Math.tan(degrees * (Math.PI/180)) * 0.5;
    },

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
    _onClick: function (event) {
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
     * event - A jQuery.Event mouse event.
     *
     * Returns nothing.
     */
    _onMouseEnterMarker: function (event) {
        var view = this._getViewByModelAttr(event.currentTarget);
        if (view) {
            view.showTooltip();
        }
    },

    /* Event handler that displays the tooltip for the marker on mouseout.
     *
     * event - A jQuery.Event mouse event.
     *
     * Returns nothing.
     */
    _onMouseLeaveMarker: function (event) {
        var view = this._getViewByModelAttr(event.currentTarget);
        if (view) {
            view.hideTooltip();
        }
    }
});

// Add show/hide methods to the view.
jQuery.extend(true, HubMarkers.prototype, mixins.proxy);
