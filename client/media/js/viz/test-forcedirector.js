// A visualisation canvas overlay, for testing and demonstrating the application's force-directed physics engine.

var overlay = (function(){
    var htmlElement = document.documentElement,
        width = htmlElement.clientWidth,
        height = htmlElement.clientHeight
        //offset = jQuery("body").offset(),
        canvas = jQuery("<canvas id=test-forcedirector></canvas>")
            .css({
                position:"absolute",
                top:0,
                left:0,
                width:"100%",
                height:"100%"
            })
            .attr({
                width:  width,
                height: height
            })
            .appendTo("body"),
        context = canvas[0].getContext("2d");
        
    context.fillRect(50, 25, 150, 100);
        
    return canvas;
}());
