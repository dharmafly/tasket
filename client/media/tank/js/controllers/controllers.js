/* Public: Controller class for managing the application state. This is
 * intended to be extended and can define routes that the controller intends
 * to handle and an initialize method for setup without having to call the
 * constructor.
 *
 * If a Router is provided it will register it's own routes and provides
 * a proxy to the Router#navigate() method.
 *
 * options - An options object.
 *           router: An instance of Backbone.Router.
 *
 * Examples
 *
 *   // Create a new controller.
 *   var HubController = Controller.extend({
 *       routes: {
 *           '/hubs/new/': 'newHub',
 *           '/hubs/:id/': 'showHub'
 *       },
 *       newHub: function () {},
 *       showHub: function (id) {},
 *   });
 *
 *   // Then in your bootstrap.
 *   var router = new Backbone.Router();
 *   var hubController = new HubController({router: router});
 *
 *   location.hash = '/hubs/new/'; // Calls hubController.newHub().
 *
 * Returns an instance of Controller.
 */
function Controller(options) {
    var routes;

    this.router = options && options.router;

    if (this.router) {
        routes = this.routes;

        // Call the routes object if it's a function.
        if (typeof routes === 'function') {
            routes = routes.apply(this);
        }

        // Register the controllers routes with the router.
        _.each(routes, function (name, route) {
            this.router.route(route, name, _.bind(this[name], this));
        }, this);
    }

    this.initialize.apply(this, arguments);
}

// Create the controller prototype. All a Controller has is a routes object
// and an initialize method. Otherwise it can be used in any fashion the
// required.
_.extend(Controller.prototype, Backbone.Event, {
    /* An array of route/method pairs or a function returning one. */
    routes: {},

    /* Public: An initilaization method for setting up the instance
     * properties and other calls.
     *
     * options - An options object.
     *           router: An instance of Backbone.Router.
     *
     * Returns nothing.
     */
    initialize : function(){},

    /* Public: An alias to Backbone.History#navigate().
     *
     * url     - The route to update.
     * trigger - If true calls any associated callbacks.
     *
     * Examples
     *
     *   controller.navigate('/hubs/1/');
     *
     * Returns itself.
     */
    navigate: function () {
        if (this.router) {
            this.router.navigate.apply(this.router, arguments);
        }
        return this;
    }
});

// Assign the extend function. This is the shared between all Backbone
// classes and can be applied to any constructor function.
Controller.extend = Backbone.Model.extend;
