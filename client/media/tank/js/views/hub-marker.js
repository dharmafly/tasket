/* Public: A tank view to handle the display of the Tank. Currently only
 * handles panning of the view but over time many of the TankController
 * methods could be moved into here.
 *
 * options - An options object to be passed into the constructor.
 *           el: An Element to use in the view. Usually "body".
 *
 * Examples
 *
 *   var marker = new HubMarkerView({model: hub});
 *
 * Returns a new instance of the Tank view.
 */
var HubMarker = View.extend({

    /* Class name for the root element. */
    className: "hub-marker",

    /* View event listeners. */
    events: {},

    /* Classes to manipulate the view state */
    classes: {
        showTooltip: "show"
    },

    /* Initialises the HubMarkerView object.
     *
     * options - An options element for the view.
     *
     * Returns nothing.
     */
    constructor: function HubMarkerView() {
        View.apply(this, arguments);
    },

    /* Public: Positions the view at the provided offset. Also orientates
     * the marker at the provided angle if provided.
     *
     * offset - An offset object with top and left properties.
     * angle  - An angle in degrees (optional).
     *
     * Examples
     *
     *   view.position({top: 30, left: 20}, 45);
     *
     * Returns itself.
     */
    position: function (offset, angle) {
        this.elem.css(offset);
        return this.angle(angle);
    },

    /* Public: Points the marker at the angle provided. The angle should be
     * in radians where 0 is the positive x-axis and the rotation is counter
     * clockwise.
     *
     * angle - An angle in radians (0 is positive x-axis).
     *
     * Examples
     *
     *   marker.angle(0); // East
     *   marker.angle(Math.PI / 2); // 90 degrees (North).
     *
     * Returns itself.
     */
    angle: function (angle) {
        var transform = getCSSProperty('transform');

        // CSS expects angle to rotate clockwise so we accomodate for this
        // by subtracting it from 2π. Also starts 135 degrees from 0 (x-axis)
        // also accomodate for that.
        angle = (2 * Math.PI - angle) + (Math.PI * 0.75);

        this._angle = angle;

        if (transform) {
            this.$('.hub-marker-pointer').css(transform, 'rotate(' + angle + 'rad)');
        }

        return this;
    },

    /* Public: Scales the marker to a percentage of it's normal size.
     *
     * percentage - A percentage between 0 and 1.
     *
     * Examples
     *
     *   markerView.scale(0.5); // Marker is now half the size.
     *
     * Returns itself.
     */
    scale: function (percentage) {
        var transform = getCSSProperty('transform');

        this._scale = percentage;
        if (transform) {
            this.elem.css(transform, 'scale(' + percentage + ')');
        }
        this.elem.css('opacity', percentage);

        return this;
    },

    /* Public: Show the tooltip for the current marker.
     *
     * Examples
     *
     *   view.showTooltip();
     *
     * Returns itself.
     */
    showTooltip: function () {
        this.tooltip.addClass(this.classes.showTooltip);
        this._positionTooltip();
        this._bumpIndex();
        this._cacheScale = this._scale;
        return this.scale(1);
    },

    /* Public: Hide the tooltip for the current marker.
     *
     * Examples
     *
     *   view.hideTooltip();
     *
     * Returns itself.
     */
    hideTooltip: function () {
        this.tooltip.removeClass(this.classes.showTooltip);
        return this.scale(this._cacheScale || this._scale);
    },

    /* Public: Renders the current view.
     *
     * Examples
     *
     *   $("body").append(marker.render());
     *
     * Returns the root view element.
     */
    render: function () {
        var image = this.model.get("image"), html;
        image = image ? Tasket.thumbnail(image, 15, 15, true) : Tasket.media(app.hubPlaceholderImage);

        html = tim('hub-marker', {
            id:    this.model.id,
            title: this.model.get("title"),
            image: image
        });

        this.elem.html(html);
        this.tooltip = this.$('.tooltip');

        return this._positionTooltip()._bumpIndex().el;
    },

    /* Positions the tooltip above the marker. Currently just sits above the
     * marker but could in future ajust depending on the current angle.
     *
     * Examples
     *
     *   view._positionTooltip();
     *
     * Returns itself.
     */
    _positionTooltip: function () {
        this.tooltip.css({
            'margin-top':  -this.tooltip.outerHeight(),
            'margin-left': -this.tooltip.outerWidth() / 2
        });
        return this;
    },

    /* Bumps the z-index on the view to ensure that it always sits above
     * others.
     *
     * Returns itself.
     */
    _bumpIndex: function () {
        this.elem.css('z-index', HubMarker.zindex += 1);
        return this;
    }
}, {
    /* Base z-index for all views. Gets incremented by #_bumpIndex() */
    zindex: 999999
});

// Add show/hide methods to the view.
jQuery.extend(true, HubMarker.prototype, mixins.toggle);