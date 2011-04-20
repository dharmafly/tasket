/*global require */

require.def('SA_tasket', ['kgd/core', 'kgd/consts', 'kgd/world/World','kgd/world/Thing',  'kgd/simpleApp/SimpleApp', /*'kgd/maths/v2',*/ 'scripts/tasketter.js', 'scripts/vec2.js'], function(core, consts, World, Thing, SimpleApp/*, v2*/){
	//vec2 = v2.vec2;
	var DEFAULT_PROJ = 'projectA';

	SA_tasket = function(){
		SimpleApp.call(this);
	};

	SA_tasket.prototype = {
		onBoot: function(){
			this.addSlider(this.world.tk, 'physics_dt', 'Time interval', 0.01, 3.1);
			this.addSlider(this.world.tk, 'inScaleFac', 'Image Scale Factor', 0.1, 1.5);
			this.addSlider(this.world.tk, 'inCoulombK', 'Coulomb K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inBBRepulsion', 'BBox Repulsion K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inHookeK', 'Hooke K.', 0.0, 0.5);
			this.addSlider(this.world.tk, 'inWallRepulsion', 'Wall Repulsion K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inHookeEquilib', 'Hooke Equilibrium', -0.1, 100.1);
			this.addSlider(this.world.tk, 'inVelDampK', 'Vel. Damping', 0.0, 1.1);
			this.addSlider(this.world.tk, 'right', 'Right wall', -100.0, 500);
			this.addSlider(this.world.tk, 'top', 'Top wall', -100.0, 500);
			this.addSlider(this.world.tk, 'left', 'Left wall', -100.0, 500);
			this.addSlider(this.world.tk, 'bottom', 'Bottom wall', -100.0, 500);

			var that = this;

			this.world.tk.projData = tasket_data.projects[DEFAULT_PROJ];
			this.world.init();
			
		}

	};

	core.extend(SA_tasket, SimpleApp);

	TasketterWrap = function(){
		World.call(this);
		this.tk = new Tasketter();
		// for use by nodes' drawing method
		this.nodes = this.tk.nodes;
		this.drawBBFlag = true;
	};

	TasketterWrap.prototype = {
		init: function(){
			this.context.lineWidth = 1;
			this.tk.context = this.context;
			this.tk.init();
			this.updateIntro();
		},

		updateCycle: function(dt){
			this.tk.updateCycle(this.tk.physics_dt);
		},
		// Drawing and DOM-related ---- can be snipped for headless class		

		setUp: function(k){
			switch(k){
			case '0':
				this.tk.runningTime = 0;
				this.tk.randomizeNodes();
				// and make project the central node
				this.tk.nodes[0].makeCentralNode();
				break;
			case '1':
				this.tk.randomizeNodes();
				this.tk.nodes[0].makeCentralNode();
				this.tk.benchmark(200, 0.5);
			}
		},

		screenStats: function(){
			ctx = this.context;
			ctx.fillStyle    = '#fff';
			ctx.font         = '10px sans-serif';
			ctx.textBaseline = 'top';
			ctx.fillText(aux.coordString(this.mousePos, 'Mouse:'), 8-this.dim[0], 8-this.dim[1]);
			ctx.fillText(this.tk.runningTime, 8-this.dim[0], 18-this.dim[1]);
			//ctx.font         = 'bold 12px sans-serif';
			//ctx.strokeText('Hello world!', 10, 18);
		},

		draw: function(){
			var ctx = this.context;
			ctx.fillStyle = this.BACKGROUND_COLOR;
			ctx.strokeStyle = this.FOREGROUND_COLOR;
			ctx.fillRect(-this.origin[0], -this.origin[1], this.canvas.width, this.canvas.height);
			for(var i=0; i<this.tk.objects.length; i++){
				this.tk.nodes[i].drawLinks();
			}

			for(i=0; i<this.tk.objects.length; i++){
				this.tk.nodes[i].draw();
			}

			if(this.drawBBFlag){
				var bBox = this.tk.getProjBBox();
				ctx.strokeStyle = '#0f0';
				ctx.strokeRect(bBox[0][0]-2, bBox[0][1]-2, bBox[1][0] - bBox[0][0]+4, bBox[1][1] - bBox[0][1]+4);
			}


			if(this.tk.wallsFlag){
				var WALL_LIM = 500;
				ctx.strokeStyle = '#0ff';
				// t, b, l, r
				ctx.beginPath();
				ctx.moveTo(-WALL_LIM, this.tk.top);
				ctx.lineTo(WALL_LIM, this.tk.top);
				ctx.moveTo(-WALL_LIM, this.tk.bottom);
				ctx.lineTo(WALL_LIM, this.tk.bottom);
				ctx.moveTo(this.tk.left, WALL_LIM);
				ctx.lineTo(this.tk.left, -WALL_LIM);
				ctx.moveTo(this.tk.right, WALL_LIM);
				ctx.lineTo(this.tk.right, -WALL_LIM);
				ctx.stroke();
			}

		},

		updateIntro: function(){
			$('#intro h2').html(this.tk.projData.title);
			$('#intro #blurb').html(this.tk.projData.description);
		},

		mouseDown: function(e){
			if(this.getObjectAtMouse()){
				this.selectedObject.makeCentralNode();
			}
			console.log('Object selected: ' + this.selectedObject);
		},

		testTethering: function(){
			this.tk.reset();
			var n;
			for(var i=0; i<400; i+=50){
				n = this.tk.addTask({key:i});
				n.addTether(i-200, (0.5 - Math.random())*100);
			}
		}
					
	};

	core.extend(TasketterWrap, World);

	return {
		world: TasketterWrap,
		app: SA_tasket
	};

});

