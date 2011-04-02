/*
f = app.forcedirected;
//f.reset();
var h1 = app.tankController.addHub(new Hub({id:100, title:"foo"}), {left:100, top:100});
var h2 = app.tankController.addHub(new Hub({id:101, title:"foo"}), {left:130, top:130});

var view = h1, offset = view.offset(), width = view.nucleusWidth + view.labelElem.outerWidth(true), height = view.nucleusWidth + view.labelElem.outerHeight(true), id = view.model.id, wallBuffer = width * 0.2, wallRight = jQuery("section.dashboard").offset().left - wallBuffer, wallLeft = wallBuffer, wallTop = window.innerHeight - wallBuffer - jQuery("div.header-container").outerHeight(true), wallBottom = wallBuffer; 

f.wallsFlag = true;
f.top = wallTop;
f.bottom = wallBottom;
f.left = wallLeft;
f.right = wallRight;

var h1Force = f.addTask({key:id, x:offset.left, y:offset.top, width: width, height: height});

var view = h2, offset = view.offset(), width = view.nucleusWidth + view.labelElem.outerWidth(true), height = view.nucleusWidth + view.labelElem.outerHeight(true), id = view.model.id;

var h2Force = f.addTask({key:id, x:offset.left, y:offset.top, width: width, height: height});

var i = 0;
function loop(){
    var max = 50;

    f.updateCycle(0.5);

    var h1Pos = h1Force.getPos(), h2Pos = h2Force.getPos();
    h1.offset({left: h1Pos.x, top:h1Pos.y + h1.nucleusWidth / 2});
    h2.offset({left: h2Pos.x, top:h2Pos.y + h2.nucleusWidth / 2});
    if (i <= max){
        window.setTimeout(function(){
            loop(++i);
        }, 100);
    }
}
loop();


console.log(h1Force.getPos(), h2Force.getPos());
// Show walls
jQuery("<div style='position:absolute; outline:1px solid green; width:" + (wallRight-wallLeft) + "px; top:" + (window.innerHeight - wallTop) + "px; height: " + (wallTop - wallBottom) + "px; left:" + wallLeft + "px;'></div>").appendTo("body");
*/

//////////////

f = app.forcedirected;
f.reset();
var h1 = hubViews[1];

// TODO TEMP;
hubViews[0].elem.remove();
h1.offset({
    left:400,
    top:400
});

function invertY(y){
    return window.innerHeight - y;
}


var view = h1,
    offset = view.nucleusElem.offset(), // TODO NOTE! not the same as view.offset() due to negative margin on nucleusElem
    hubWidth = view.nucleusWidth,
    hubHeight = view.nucleusWidth,
    descElem = view.labelElem,
    descWidth = descElem.outerWidth(),
    descHeight = descElem.outerHeight(),
    descOffset = descElem.offset(),
    hubId = view.model.id,
    hubBufferX = 50,
    hubBufferY = 50,
    bufferFactor = 0.2,
    wallBufferX = (hubWidth + descWidth) * bufferFactor,
    wallBufferY = (hubHeight + descHeight) * bufferFactor,
    wallRight = jQuery("section.dashboard").offset().left - wallBufferX,
    wallLeft = wallBufferX,
    wallTop = invertY(wallBufferY + jQuery("div.header-container").outerHeight(true)),
    wallBottom = wallBufferY; // TODO: ensure bottom wall is below hub bottom + hubBufferY (and similar for other walls)

f.wallsFlag = true;
f.top = wallTop;
f.bottom = wallBottom;
f.left = wallLeft;
f.right = wallRight;

O("f", f);

view.refreshTasks();

window.setTimeout(function(){ // TODO: callback
    view.generateTaskViews();
    var taskViews = view.taskViews.value();
    f.addProject({
        key: hubId,
        width: hubWidth + hubBufferX,
        height: hubHeight + hubBufferY,
        x: offset.left - (hubBufferX / 2),
        y: invertY(offset.top)
    });
    
    // Add hub description
    //var descNode = f.addTaskToProject({key:"hubDesc", width:descWidth, height:descHeight, x:descOffset.left, y:invertY(descOffset.top)});
    var descNode = f.addTaskToProject({
        key: "hubDesc",
        width: descWidth + hubBufferX,
        height: descHeight + hubBufferY,
        x: descOffset.left + (descWidth / 2) - (hubBufferX / 2),
        y: invertY(descOffset.top)
    });
    descNode.fixed = true;

    /////
    
    /*
    var taskView = window.taskView = taskViews[0];
    var model = taskView.model,
            elem = taskView.elem,
            width, height;
            
        elem.appendTo(view.taskListElem);
        width = elem.outerWidth(true);
        height = elem.outerHeight(true);
    
    if (!adjustedWallsWithTaskDimensions){ // TODO: need to do this with largest width and height of a task
        adjustedWallsWithTaskDimensions = true;
    
        f.left = wallLeft = wallLeft + (width / 2);
        f.right = wallRight = wallRight - (width / 2);
        f.top = wallTop = wallTop - (height / 2);
        f.bottom = wallBottom = wallBottom + (height / 2);

        // Show walls
        jQuery("<div style='position:absolute; outline:1px solid green; width:" + (wallRight-wallLeft) + "px; top:" + invertY(wallTop) + "px; height: " + (wallTop - wallBottom) + "px; left:" + wallLeft + "px;'></div>").appendTo("body");
    }
    
    var node = f.addTaskToProject({key:taskView.model.id, width:width, height:height, x:0, y:invertY(0)});
    var i = 0;
    
    function draw(){
        var taskPos = node.getPos();
        O(i++, JSON.stringify(taskPos));
        
        taskView.offset({
            left:taskPos.x - width / 2 - offset.left,
            top:invertY(taskPos.y + height / 2) - offset.top
        });
    }
    draw();
    
    bodyElem.click(function(){
        f.updateCycle(1);
        draw();
    });
    
    /**/
    
    _(taskViews).each(function(taskView){
        var model = taskView.model,
            taskElem = taskView.elem,
            taskWidth, taskHeight;
            
        taskElem.appendTo(view.taskListElem);
        taskWidth = taskElem.outerWidth();
        taskHeight = taskElem.outerHeight();
        
        // Show walls
        jQuery("<div style='position:absolute; outline:1px solid green; width:" + (wallRight-wallLeft) + "px; top:" + invertY(wallTop) + "px; height: " + (wallTop - wallBottom) + "px; left:" + wallLeft + "px;'></div>").appendTo("body");
        
        // TODO: set f.TASK_WIDTH, etc.
        // TODO: try setting far away from the nucleus, distributed equally around the circle
        f.addTaskToProject({
            key: model.id,
            width: taskWidth,
            height: taskHeight,
            x: offset.left + Math.random() - 0.5,
            y: invertY(offset.top + Math.random() - 0.5)
        });
    });
    
    f.inCoulombK = 750;
    var i = 0,
        max = 400,
        deltaTMin = 0.2,
        deltaTEase = 1.5,
        deltaTFactor = 0.01,
        active = true,
        showDraw = false;
    
    jQuery(document).click(function(){
        active = !active;
        if (active && i <= max){
            loop(++i);
        }
        else {
            O("stopped at: " + i);
            O("deltaTEase: " + deltaTEase);
            _(taskViews).each(function(taskView){
                var id = taskView.model.id,
                    taskPos = f.nodesByKey[id].getPos();
                O("id:", id, JSON.stringify(taskPos), taskView.el);
            });
        }
    });
    
    function repositionTasks(){
        _(taskViews).each(function(taskView){
            var fTask = f.nodesByKey[taskView.model.id],
                taskPos = fTask.getPos(),
                taskElem = taskView.elem,
                taskWidth = taskElem.outerWidth(),
                taskHeight = taskElem.outerHeight();
                
            //O(i, "id:", taskView.model.id, JSON.stringify(taskPos));
            
            // repaint
            taskView.offset({
                left:taskPos.x - taskWidth / 2 - offset.left,
                top:invertY(taskPos.y + offset.top + taskHeight / 2)
            });
        });
    }
    
    function loop(){
        if (i){
            f.updateCycle(deltaTMin + deltaTEase); // TODO: ease-out the update cycle
            deltaTEase = deltaTEase - (deltaTEase * deltaTFactor);
        }
        
        if (active && i <= max){
            if (showDraw){
                window.setTimeout(function(){
                    loop(++i);
                    repositionTasks()
                }, 15);
            }
            else {
                loop(++i);
            }
        }
        else {
            repositionTasks();
        }
    }
    loop();/**/
}, 500);
