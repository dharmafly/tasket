var ChangePassword = Form.extend({
    constructor: function ChangePassword() {
        SignUp.prototype.constructor.apply(this, arguments);
        
        // Ensure that user model has loaded from the server before submitting
        this.bind("beforeSave", function(data, user, form){
            if (!user.get("username")){ O('!user.get("username")', data, user, form);
                form.abort = true;
                user.bind("change:username", _.bind(form.submit, form));
                // NOTE: if the user doesn't actually exist, then the form will not do anything. That's probably OK. It should never happen.
            }
        });

        // Verify that the passwords match
        this.bind("beforeSave", function(data, user, form){
            var pass1 = data.password,
                pass2 = data.password_confirm;
                
            if (!pass1 && !pass2){
                form.errors({
                    password: ["Password required"],
                    password_confirm: ["Password required"]
                });
                form.abort = true; // prevent the user model from saving. see Form.submit()
            }
        
            else if (pass1 !== pass2){
                form.errors({
                    password: ["Passwords do not match"]
                });
                form.abort = true; // prevent the user model from saving. see Form.submit()
            }
        });

        // Remove the password fields from the User model.
        this.bind("submit", function (user) {
            _.each(["password", "password_confirm"], function (attribute) {
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
