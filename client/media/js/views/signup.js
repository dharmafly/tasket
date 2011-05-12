var SignUp = FormUpload.extend({
    constructor: function SignUpForm() {
        Form.prototype.constructor.apply(this, arguments);

        // Verify that the passwords match
        this.bind("beforeSave", function(data, user, form){
            var pass1 = data.password,
                pass2 = data["password-confirm"];
                
            if (form.passwordRequired && !pass1 && !pass2){
                form.errors({
                    password: ["Password required"],
                    "password-confirm": ["Password required"]
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
            _.each(["password", "password-confirm"], function (attribute) {
                user.unset(attribute, {silent: true});
            });
        });
    },
    
    passwordRequired: true,

    url: function () {
        return this.model.url() + "/image/";
    },

    render: function () {
        var html = tim("signup");
        this.elem.html(html).find(".loading").hide();
        return this;
    }
});
