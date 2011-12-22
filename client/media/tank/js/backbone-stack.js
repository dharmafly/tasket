/* Public: Monkey patch Backbone to provide support for fragment
 * history. This allows us to track the changes in the fragment
 * an implement a "back" button.
 *
 * New methods include History#stack() that returns an array of all
 * previous fragments and History#getPrevious() which returns the
 * last hash before the current one.
 */
(function (Backbone, undefined) {

    // Store a reference to the original prototype methods.
    var _navigate = Backbone.History.prototype.navigate,
        _loadUrl  = Backbone.History.prototype.loadUrl;

    /* Public: Override Backbone.history.start to use Ben Allmans $.hashchange()
     * plugin to fix hashchange events in IE.
     *
     * See: http://stackoverflow.com/questions/4973936/backbone-js-cause-bug-only-in-ie7
     *
     * Returns nothing.
     */
    Backbone.History.prototype.start = function () {
        jQuery(window).hashchange(_.bind(this.checkUrl, this)).hashchange();
    };

    /* Public: Returns the previous hash before the current one (or more).
     * If this does not exist, returns undefined.
     *
     * Examples
     *
     *   Backbone.history.getPrevious();
     *   // => '/hubs/'
     *
     *   Backbone.history.getPrevious(2);
     *   // => '/help/'
     *
     * Returns a hash String.
     */
    Backbone.History.prototype.getPrevious = function (historyCount) {
        if (!_.isNumber(historyCount)){
            historyCount = 1;
        }
        return this.stack()[this.stack().length - 1 - historyCount];
    };

    /* Public: Returns the full stack of hashes since the application
     * launched. This includes those triggering the hashchange and those
     * set manually using History#setLocation().
     *
     * Examples
     *
     *   Backbone.history.stack();
     *   // => ["/about/", "/projects/", "/projects/new/"]
     *
     * Returns nothing.
     */
    Backbone.History.prototype.stack = function () {
        this._stack = this._stack || [];
        return this._stack;
    };

    /* Public: Save a fragment into the hash history. You are responsible
     * for properly URL-encoding the fragment in advance. This does not trigger
     * a `hashchange` event.
     *
     * This method is an original History method but has been monkey patched
     * to save the fragment in the stack.
     *
     * fragment - A hash String to update the location to.
     *
     * Returns nothing.
     */
    Backbone.History.prototype.navigate = function(fragment, triggerRoute) {
        fragment = (fragment || '').replace(/^#*/, '');
        if (this.getFragment() === fragment) {
            return;
        }
        this.stack().push(fragment);
        _navigate.call(this, fragment, triggerRoute);
    };

    /* Public: Attempt to load the current URL fragment. If a route succeeds
     * with a match, returns `true`. If no defined routes matches the fragment,
     * returns false.
     * This method is an original History method but has been monkey patched
     * to save the fragment in the stack.
     *
     * Returns true if the fragment has been matched.
     */
    Backbone.History.prototype.loadUrl = function () {
        var loaded = _loadUrl.call(this);
        if (loaded) {
            this.stack().push(this.getFragment());
        }
        return loaded;
    };

}(Backbone));
