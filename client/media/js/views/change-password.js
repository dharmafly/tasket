var ChangePassword = Form.extend({
    constructor: function ChangePassword() {
        SignUp.prototype.constructor.apply(this, arguments);
        
        // Ensure that user model has loaded from the server before submitting
        this.bind("beforeSave", function(data, user, form){
            if (!user.get("username")){
                form.abort = true;
                user.bind("change:username", _.bind(form.submit, form));
            }
        });

        // Verify that the passwords match
        this.bind("beforeSave", function(data, user, form){
            var pass1 = data.password,
                pass2 = data["password-confirm"];
                
            if (!pass1 && !pass2){
                form.errors({
                    password: ["Password required"],
                    "password-confirm": ["Password required"]
                });
                form.abort = true; // prevent the user model from saving. see Form.submit()
            }
        
            else if ((pass1 || pass2) && pass1 !== pass2){
                form.errors({
                    password: ["Passwords do not match"]
                });
                form.abort = true; // prevent the user model from saving. see Form.submit()
            }
        });

        // Remove the password fields from the User model.
        this.bind("submit", function (user) {
            _.each(["password", "password-confirm"], function (attribute) {
                user.unset(attribute, {silent: true});
            });
        });
    },

    render: function () {
        var html = tim("change-password");
        this.elem.html(html);
        return this;
    }
});
