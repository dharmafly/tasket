// Setup the toolbar.
app.setupToolbar = function () {
    var toolbar  = jQuery('.header-container'),
        login    = toolbar.find('.login'),
        userbar  = toolbar.find('h2'),
        tasks    = toolbar.find('.tasks'),
        actions  = {};

    // Actions to perform when the user chanegs.
    actions = {
        // Toggle the display of the login/logout buttons.
        toggleLogin: function (user) {
            var loginState  = user ? 'hide' : 'show',
                logoutState = user ? 'show' : 'hide';

            // Toggle the forms.
            login.find('a')[loginState]();
            login.find('form')[logoutState]();
        },

        // Update the current user box or hide it.
        updateUser: function (user) {
            if (user) {
                userbar.show();
                if (user.get('image')) {
                    userbar.find('img').attr(
                        'src', Tasket.thumbnail(user.get('image'), 16, 16, true)
                    );
                }
                userbar.find('a').text(user.get('name'));
            } else {
                userbar.hide();
            }
        },

        // Update the tasks status bar in the toolbar or hide it if there
        // is no current user.
        updateTasks: function (user) {
            var taskLists;
            if (user) {
                taskLists = user.get('tasks');
                tasks.show();
                tasks.find('.pending').text(
                    user.get('tasks.claimed.claimed').length
                );
                tasks.find('.done').text(
                    user.get('tasks.claimed.done').length + user.get('tasks.claimed.verified').length
                );
            } else {
                tasks.hide();
            }
        },

        // Toggles the sign up button.
        updateSignup: function (user) {
            var state = user ? 'hide' : 'show';
            toolbar.find('[href*=sign-up]')[state]();
        }
    };

    // Watch for changes to the current user and update the toolbar accordinly.
    app.bind('change:currentUser', function (user) {
        _.each(actions, function (method) {
            method(user);
        });

        // Watch the user model for changes. When they occur update
        // the appropraite areas.
        if (user) {
            user.bind('change', function () {
                var taskKeys = ['tasks.claimed.claimed', 'tasks.claimed.verified', 'tasks.claimed.done'],
                    userKeys = ['name', 'image'],
                    changedAttr = user.changedAttributes(),
                    changedKeys = _.keys(changedAttr);

                if (_.intersect(changedAttr, taskKeys).length) {
                    actions.updateTasks(user);
                }

                if (_.intersect(changedAttr, userKeys)) {
                    actions.updateUser(user);
                }
            });
        }
    });
};

