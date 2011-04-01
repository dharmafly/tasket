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

function invertY(y){
    return window.innerHeight - y;
}


var view = h1, offset = view.offset(), width = view.nucleusWidth + view.labelElem.outerWidth(true), height = view.nucleusWidth + view.labelElem.outerHeight(true), id = view.model.id, wallBuffer = width * 0.2, wallRight = jQuery("section.dashboard").offset().left - wallBuffer, wallLeft = wallBuffer, wallTop = invertY(wallBuffer - jQuery("div.header-container").outerHeight(true)), wallBottom = wallBuffer; 

f.wallsFlag = true;
f.top = wallTop;
f.bottom = wallBottom;
f.left = wallLeft;
f.right = wallRight;

// Show walls
jQuery("<div style='position:absolute; outline:1px solid green; width:" + (wallRight-wallLeft) + "px; top:" + (window.innerHeight - wallTop) + "px; height: " + (wallTop - wallBottom) + "px; left:" + wallLeft + "px;'></div>").appendTo("body");

view.refreshTasks();

window.setTimeout(function(){ // TODO: callback
    view.generateTaskViews();
    var taskViews = view.taskViews.value();
    f.addProject({key:id, width: width, height: height, x:offset.left, y:invertY(offset.top)});

    /////
    
    /*
    var taskView = window.taskView = taskViews[0];
    var model = taskView.model,
            elem = taskView.elem,
            width, height;
            
        elem.appendTo(view.taskListElem);
        width = elem.outerWidth(true);
        height = elem.outerHeight(true);
    
    
    
    var node = f.addTaskToProject({key:taskView.model.id, width:width, height:height, x:0, y:0});
    var taskPos = node.getPos();
    taskView.offset({
        left:taskPos.x - width / 2,
        top:taskPos.y - height / 2
    });
    */
    
    _(taskViews).each(function(taskView){
        console.log("taskView", taskView);
        var model = taskView.model,
            elem = taskView.elem,
            width, height;
            
        elem.appendTo(view.taskListElem);
        width = elem.outerWidth(true);
        height = elem.outerHeight(true);
        
        // TODO: set f.TASK_WIDTH, etc.
            
        f.addTaskToProject({key:model.id, width:width, height:height, x:offset.left - (width / 2) + Math.random(), y:invertY(offset.top - (height / 2) + Math.random())});
    });

    console.log("nodes", f.nodes);


    var i = 0;
    function loop(){
        var max = 300;

        f.updateCycle(0.5);

        _(taskViews).each(function(taskView){
            var fTask = f.nodesByKey[taskView.model.id],
                taskPos = fTask.getPos();
                
            console.log(taskView.model.id, JSON.stringify(taskPos));
            
            // repaint
            taskView.offset({
                left:taskPos.x - width / 2,
                top:taskPos.y - height / 2
            });
        });
        
        if (i <= max){
            window.setTimeout(function(){
                loop(++i);
            }, 50);
        }
    }
    loop();/**/
}, 500);
