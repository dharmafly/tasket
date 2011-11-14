/* Mixins is an object literal of objects that group common functionality.
 * They can be combined with Views, Models and Controllers using a deep
 * extend function such as jQuery.extend(), the deep extend allows extension
 * of nested objects, this allows events and routes to be added without
 * destroying the original.
 *
 * Examples
 *
 *   var MyView = Backbone.View();
 *
 *   // Deep extend the MyView with .show() and .hide() methods.
 *   jQuery.extend(true, MyView.prototype, mixins.toggle);
 *
 *   // Create and use the new view.
 *   var view = new MyView();
 *   view.show();
 *   view.hide();
 */
var mixins = {

    /* Methods for adding show/hide functionality to views. Requires the
     * "hide" class to be added to the stylesheet to actually hide the
     * element.
     *
     * Examples
     *
     *   var MyView = Backbone.View();
     *
     *   // Deep extend the MyView with .show() and .hide() methods.
     *   jQuery.extend(true, MyView.prototype, mixins.toggle);
     *
     *   // Create and use the new view.
     *   var view = new MyView();
     *   view.show();
     *   view.hide();
     */
    toggle: {
        /* Class names used by the mixin. */
        classes: {
            hide: "hide"
        },

        /* Public: Show the current element by removing the #classes.hide
         * class name. Triggers the "show" event passing in the view
         * to registered listeners.
         *
         * options - An options object.
         *           silent: If true will not trigger the "show" event.
         *
         * Examples
         *
         *   myView.show();
         *
         * Returns itself.
         */
        show: function (options) {
            return this._toggle("show", options);
        },

        /* Public: Hide the current element by adding the #classes.hide
         * class name. Triggers the "hide" event passing in the view
         * to registered listeners.
         *
         * options - An options object.
         *           silent: If true will not trigger the "hide" event.
         *
         * Examples
         *
         *   myView.hide();
         *   myView.hide({silent: true});
         *
         * Returns itself.
         */
        hide: function (options) {
            return this._toggle("hide", options);
        },

        /* Hide/Show the current element by toggling the #classes.hide
         * class name. Triggers an event for the method, passing in the view
         * to registered listeners.
         *
         * method  - Calling method name, "show" or "hide".
         * options - An options object.
         *           silent: If true will not trigger the "hide" event.
         *
         * Examples
         *
         *   myView._toggle("show");
         *
         * Returns itself.
         */
        _toggle: function (method, options) {
            this.elem.toggleClass(this.classes.hide, method === "hide");
            if (!options || !options.silent) {
                this.trigger(method, this);
            }
            return this;
        }
    },

    /* Methods for proxying the events of a target object via another.
     *
     * Examples
     *
     *   var HubController = Controller.extend({
     *       initialize: function () {
     *           this.hubView = new HubView();
     *
     *           // All events triggered by this.hubView will now also
     *           // be triggered by HubController instances.
     *           this._proxyEvents(this.hubView);
     *       }
     *   });
     *
     *   // Deep extend the HubController with ._proxyEvents() method.
     *   jQuery.extend(true, HubController.prototype, mixins.proxy);
     *
     *   // Or use as a one off by using call.
     *   mixins.proxy._proxyEvents.call(myListView, myChildView);
     */
    proxy: {

        /* Proxies events from the target object through the current object.
         * Useful for bubbling events up the application stack. Backbone
         * uses this technique to trigger model events on a Collection.
         *
         * target - A target object that has the Backbone.Events methods.
         *
         * Examples
         *
         *   var HubController = Controller.extend({
         *       initialize: function () {
         *           this.hubView = new HubView();
         *
         *           // All events triggered by this.hubView will now also
         *           // be triggered by HubController instances.
         *           this._proxyEvents(this.hubView);
         *       }
         *   });
         *
         * Returns itself.
         */
        _proxyEvents: function (target) {
            target.bind("all", function onProxy(name) {
                var args = Array.prototype.slice.call(arguments, 0);
                this.trigger.apply(this, args.concat([this]));
            }, this);
            return this;
        }
    }
};