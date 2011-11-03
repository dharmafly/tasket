// Handles signup/about/login etc.
var AccountController = Backbone.Router.extend({
    routes: {
        "/login/":          "login",
        "/forgot-details/": "forgotDetails",
        "/sign-up/":        "signup",
        "/account/":        "account",
        "/users/:id/change-password/": "changePassword"
    },

    constructor: function AccountController() {
        Backbone.Router.apply(this, arguments);
    },
    
    showContents: function(contents){
        app.lightbox.content(contents, "account").show();
    },

    login: function () {
        var form = new Login();
        this.showContents(form.render().el);
        form.bind("success", function (user) {
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification && app.notification.success("You are now logged in.");
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
            app.notification && app.notification.success("Your account has been created.");
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
            app.updateCurrentUser(user);
            app.lightbox.hide();
            app.notification && app.notification.success("Your account has been updated!");
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
