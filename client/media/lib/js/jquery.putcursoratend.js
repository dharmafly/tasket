// Put cursor at end of input element
// http://stackoverflow.com/q/1675345/165716

jQuery.fn.putCursorAtEnd = function(){
    return this.each(function(){
        var elem = jQuery(this),
            val = elem.val(),
            len;
    
        elem.focus();

        // If this function exists (not old IE)
        if (this.setSelectionRange) {
            // Double the length because Opera is inconsistent about whether a carriage return is one character or two
            len = val.length * 2;
            this.setSelectionRange(len, len);
        }
        else {
            // ... otherwise replace the contents with itself (doesn't work in Google Chrome)
            elem.val(val);
        }

        // Scroll to the bottom, in case we're in a tall textarea (necessary for Firefox and Google Chrome)
        this.scrollTop = 999999;
    });
};