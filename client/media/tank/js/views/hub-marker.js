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
        return this;
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
        this.elem.text(this.model.id);
        return this.el;
    }
});

// Add show/hide methods to the view.
jQuery.extend(true, HubMarker.prototype, mixins.toggle);