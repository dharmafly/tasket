// Handles signup/about/login etc.
var AccountController = Backbone.Controller.extend({
    routes: {
        "/login/":          "login",
        "/forgot-details/": "forgotDetails",
        "/sign-up/":        "signup",
        "/account/":        "account",
        "/users/:id/change-password/": "changePassword"
    },

    constructor: function PageController() {
        Backbone.Controller.prototype.constructor.apply(this, arguments);
        
        // Display contents in a lightbox if there's a matching plain HTML template for this route
        // This makes it easy for new lightbox views to be added, simply by creating a new Tim template in the HTML source
        this.route(/./, "showContents", function(){
            var route = Backbone.history.fragment,
                template;
            
            // Already accounted for in the routes hash
            if (this.routes[route]){
                return;
            }
            
            route = route.replace(/\//g, "");
            template = tim.templates()[route];
            
            // Check that this template doesn't have any Tim template tags
            if (template && template.indexOf(tim.settings().start) === -1){
                this.showContents(template);
            }
        });
    },
    
    showContents: function(contents){
        app.lightbox.content(contents).show();
    },

    login: function () {
        var form = new Login();
        this.showContents(form.render().el);

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification.success("You are now logged in.");
        });
    },
    
    forgotDetails: function () {
        var form = new ForgotDetails();
        this.showContents(form.render().el);
    },

    signup: function () {
        var form = new SignUp({
            model: new User()
        });

        this.showContents(form.render().el);

        // Append iframe for avatar upload.
        form.updateFrame();

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification.success("Your account has been created.");
        });
    },

    account: function () {
        var form = new Account({
            model: app.currentUser
        });

        if (!app.currentUser) {
            window.location.hash = "#/login";
        }

        this.showContents(form.render().el);

        // Append iframe for avatar upload.
        form.updateFrame();

        form.bind("success", function (user) {
            app.lightbox.hide();
            app.notification.success("Your account has been updated!");
        });
    },

    changePassword: function (id) {
        var form = new ChangePassword({
            model: Tasket.getUsers(id)
        });

        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
        });

        this.showContents(form.render().el);
    }
});
