/* Public: A tank view to handle the display of the Tank. Currently only
 * handles panning of the view but over time many of the TankController
 * methods could be moved into here.
 *
 * options - An options object to be passed into the constructor.
 *           el: An Element to use in the view. Usually "body".
 *
 * Examples
 *
 *   var tank = new Tank({el: $("body")});
 *
 * Returns a new instance of the Tank view.
 */
var Tank = View.extend({

    /* View event listeners. */
    events: {
        "mousedown": "_onMouseDown"
    },

    /* Classes for setting view state. */
    classes: {
        panning: 'panning'
    },

    /* Initialises the Tank view object.
     *
     * options - An options element for the view.
     *
     * Returns nothing.
     */
    constructor: function TankView() {
        View.apply(this, arguments);

        _.bindAll(this, "_onMouseMove", "_onMouseUp");

        this._viewport = $(window);
        this._document = $(document);
    },

    /* Public: Triggers the "pan" event providing an offset object so the
     * application can update the view accordingly.
     *
     * offset - An offset object with "top" and "left" properties.
     *
     * Examples
     *
     *   tank.pan({top: -30, left: -5});
     *
     * Returns itself.
     */
    pan: function (offset) {
        return this.trigger('pan', {
            top:  -offset.top,
            left: -offset.left
        });
    },

    /* Mouse event listener; waits for a mousedown event and binds further
     * listeners to handle the panning of the tank view.
     *
     * event - A mouse jQuery.Event object.
     *
     * Returns nothing.
     */
    _onMouseDown: function (event) {
        if (! (event.target === this.el || $(event.target).parents('#vector').length)) {
            return;
        }

        var offset = this._getEventOffset(event);
        this._mouseOffset = offset;
        this._viewport.bind({
            'mouseup.pan': this._onMouseUp,
            'mousemove.pan': this._onMouseMove
        });
        this.elem.addClass(this.classes.panning);
        event.preventDefault();
    },

    /* Mouse event listener; calculates the new mouse position compared to the
     * previous one and calls #pan() to update the viewport.
     *
     * event - A mouse jQuery.Event object.
     *
     * Returns nothing.
     */
    _onMouseMove: function (event) {
        var _this = this, offset;
        if (this._throttled || !this._mouseOffset) {
            return;
        }

        offset = this._getEventOffset(event);

        this.pan(this._getOffsetDiff(this._mouseOffset, offset));

        this._mouseOffset = offset;
        this._throttled = setTimeout(function () {
            delete _this._throttled;
        }, 1000 / 60);
    },

    /* Mouse event listener; handles the unbinding and removal of classes
     * when the user raises the mouse.
     *
     * event - A mouse jQuery.Event object.
     *
     * Returns nothing.
     */
    _onMouseUp: function (event) {
        delete this._mouseOffset;
        this._document.unbind('.pan');
        this.elem.removeClass(this.classes.panning);
    },

    /* Returns an offset object with top and left properties similar
     * to jQuery.fn.offset().
     *
     * event - A mouse event object.
     *
     * Returns an offset Object.
     */
    _getEventOffset: function (event) {
        // User clientX/clientY to prevent juddering as the scroll position
        // is constantly varying.
        return {
            top:  event.clientY,
            left: event.clientX
        };
    },

    /* Calculates the difference between two offset objects and returns the
     * difference as a new offset.
     *
     * offsetA - An offset object with "top" and "left" properties.
     * offsetB - The second offset to compare against offsetA
     *
     * Returns an offset object.
     */
    _getOffsetDiff: function (offsetA, offsetB) {
        return {
            top:  offsetA.top  - offsetB.top,
            left: offsetA.left - offsetB.left
        };
    }
});
