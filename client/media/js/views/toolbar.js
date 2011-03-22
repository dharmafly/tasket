// Setup the toolbar.
app.setupToolbar = function () {
    var toolbar  = $('.header-container'),
        login    = toolbar.find('.login'),
        userbar  = toolbar.find('h2'),
        tasks    = toolbar.find('.tasks');

    // Toggle the display of the login/logout buttons.
    function toggleLogin(user) {
        var loginState  = user ? 'hide' : 'show';
            logoutState = user ? 'show' : 'hide';

        // Toggle the forms.
        login.find('a')[loginState]();
        login.find('form')[logoutState]();
    }

    // Update the current user box or hide it.
    function updateUser(user) {
        if (user) {
            userbar.show();
            if (user.get('image')) {
                userbar.find('img').attr('src', user.get('image'));
            }
            userbar.find('span').text(user.get('realname'));
        } else {
            userbar.hide();
        }
    }

    // Update the tasks status bar in the toolbar or hide it if there
    // is no current user.
    function updateTasks(user) {
        var taskLists;

        if (user) {
            taskLists = user.get('tasks');
            tasks.show();
            tasks.find('.pending').text(taskLists.claimed.length);
            tasks.find('.done').text(taskLists.done.length + taskLists.verified.length);
        } else {
            tasks.hide();
        }
    }

    // Watch for changes to the current user and update the toolbar accordinly.
    app.bind('change:currentUser', function (user) {
        toggleLogin(user);
        updateUser(user);
        updateTasks(user);

        // Watch the user model for changes to tasks. When they occur update
        // the tasks box.
        if (user) {
            user.bind('change:tasks', updateTasks);
        }
    });
};

