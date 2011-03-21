function addClass(element, klass) {
    classes = element.className.split(' ');
    classes.push(klass);
    element.className = classes.join(' ');
}

function removeClass(element, klass) {
    var regexp = new RegExp('\\s*' + klass + '\\s*');
    element.className = element.className.replace(regexp, '');
}


(function () {
    // Add the helper icon to all quicklinks in the dashboard.
    var helpers = document.querySelectorAll('.help'),
        hover_class = 'active';

    $.each(helpers, function (index, helper) {
        var info = document.createElement('a');

        info.href  = '#info';
        info.className = 'info';
        info.appendChild(document.createTextNode('Help'));

        // Add class to helper when button is hovered so we can display it in the stylesheet.
        info.onmouseover = info.onfocus = function () { addClass(helper, hover_class); };
        info.onmouseout  = info.onblur  = function () { removeClass(helper, hover_class); };

        // Append this to the dashboard section.
        helper.parentNode.appendChild(info);
    });
}());

window.lightbox = new Lightbox();

// Set up the lightboxes.
(function () {
    var template, templates = {
        'signup': '[href="#/sign-up/"]',
        'login': '.login a',
        'about': '[href="#/about/"]',
        //'new': '[href$="/new/"]'
    };

    $.each(templates, function (template_name, selector) {
        var html = tim(template_name);

        $(selector).click(function (event) {
            window.lightbox.render(html).show();
            event.preventDefault();
        });
    });
}());

// Set up the dashbaord detail boxes.
(function () {
    var details;

    details = {
        '[href="#/projects/"]': tim('dashboard-detail', {
            type: 'projects',
            title: 'Projects',
            content: tim('dashboard-detail-projects', {
                pending: [
                    {name: 'My pending task', slug: 'my-pending-task'}
                ],
                done: [
                    {name: 'My done task', slug: 'my-done-task'}
                ]
            })
        }),
        '.button[href="#/tasks/"]': tim('dashboard-detail', {
            type: 'project',
            title: 'Detail Title',
            content: tim('dashboard-detail-project', {
                name: 'Project Name',
                slug: 'project-name',
                image: 'media/images/placeholder.png',
                organisation: 'The Organisation',
                tags: [
                    {name:'red', slug: 'red'},
                    {name:'blue', slug: 'blue'},
                    {name:'green', slug: 'green'},
                    {name:'orange', slug: 'orange'}
                ],
                tasks: [
                    {name: 'My Task'}, {name: 'My other task'}
                ]
            })
        }),
        '[href="#/user/another-user/"]': tim('dashboard-detail', {
            type: 'user',
            title: 'Another User',
            content: tim('dashboard-detail-user', {
                name: 'Bilbo Baggins',
                image: 'media/images/placeholder.png',
                location: 'The Shire, Middle Earth',
                projects: [
                    {title: 'An awesome project', slug: 'an-awesome-project', isCurrent: false},
                    {title: 'Another awesome project', slug: 'another-awesome-project', isCurrent: true},
                    {title: 'Final awesome project', slug: 'final-awesome-project', isCurrent: false}
                ],
                tasks: [
                    {title: 'An awesome project', slug: 'an-awesome-project', isCurrent: false},
                    {title: 'Another awesome project', slug: 'another-awesome-project', isCurrent: true},
                    {title: 'Final awesome project', slug: 'final-awesome-project', isCurrent: false}
                ],
                managed: [
                    {title: 'An awesome project', slug: 'an-awesome-project', isCurrent: false},
                    {title: 'Another awesome project', slug: 'another-awesome-project', isCurrent: true},
                    {title: 'Final awesome project', slug: 'final-awesome-project', isCurrent: false}
                ]
            })
        })
    };

    /*
    $.each(details, function (selector, html) {
        var detail = $(html).appendTo('.dashboard').hide();

        document.querySelector(selector).onclick = function () {
            var close = detail.find('.close');

            detail.show();
            detail.parent().addClass('detail-active');

            close.click(function (event) {
                detail.hide().parent().removeClass('detail-active');
                event.preventDefault();
            });

            return false;
        };
    });
    */
}());
