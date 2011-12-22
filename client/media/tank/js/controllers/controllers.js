/* Public: Controller class for managing the application state. This is
 * intended to be extended and can define routes that the controller intends
 * to handle and an initialize method for setup without having to call the
 * constructor.
 *
 * If a Router is provided it will register its own routes and provides
 * a proxy to the Router#navigate() method.
 *
 * This object exists as well as the Backbone.Router because there should
 * only be one "router" instance per application which will manage all
 * registered routes and as such allows the binding to "route:*" to listen
 * for app changes across the entire application. These controllers allow
 * logic to be split up into smaller modules while retaining a single route
 * registry.
 *
 * options - An options object.
 *           router: An instance of Backbone.Router (optional).
 *
 * Examples
 *
 *   // Create a new controller.
 *   var HubController = Controller.extend({
 *       routes: {
 *           "/projects/new/": "newHub",
 *           "/projects/:id/": "showHub"
 *       },
 *       newHub: function () {},
 *       showHub: function (id) {},
 *   });
 *
 *   // Then in your bootstrap.
 *   var router = new Backbone.Router();
 *   var hubController = new HubController({router: router});
 *
 *   location.hash = "/projects/new/"; // Calls hubController.newHub().
 *
 * Returns an instance of Controller.
 */
function Controller(options) {
    var routes;

    this.router = options && options.router;

    if (this.router) {
        routes = this.routes;

        // Call the routes object if it's a function.
        if (typeof routes === "function") {
            routes = routes.apply(this);
        }

        // Format the routes into arguments for the Router#route() method.
        routes = _(routes).chain().map(function (name, route) {
            var fn = this[name];
            return _.isFunction(fn) ? [route, name, _.bind(fn, this)] : null;
        }, this);

        // Reverse them to ensure they retain precedence and add each
        // route to the router. See documentation for Backbone router for
        // details on why they must be reversed.
        // http://documentcloud.github.com/backbone/docs/backbone.html#section-86
        routes.compact().reverse().each(function (args) {
            this.route.apply(this, args);
        }, this.router);
    }

    this.initialize.apply(this, arguments);
}

// Create the controller prototype. All a Controller has is a routes object
// and an initialize method. Otherwise it can be used in any fashion the
// required.
_.extend(Controller.prototype, Backbone.Events, {
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
    initialize : function () {},

    /* Public: An alias to Backbone.History#navigate().
     *
     * url     - The route to update.
     * trigger - If true calls any associated callbacks.
     *
     * Examples
     *
     *   controller.navigate("/projects/1/");
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
