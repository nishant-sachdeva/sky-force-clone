window.addEventListener('load', load_game, false);

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

function load_game() {
	document.addEventListener('mousemove', handleMouseMove, false);

	create_scene();

	create_lights();

	create_plane();

	create_enemies();
	
	create_sea();
	
	create_sky();
	
	run_game_loop();

}

var mousePos={x:0, y:0};

// now handle the mousemove event

function handleMouseMove(event) {
	var tx = -1 + (event.clientX / WIDTH)*2;
	var ty = 1 - (event.clientY / HEIGHT)*2;
	mousePos = {x:tx, y:ty};

}



var scene,camera, fieldOfView, aspectRatio;
var nearPlane, farPlane, HEIGHT, WIDTH;
var renderer, container;

function create_scene() {
	console.log("We are getting here");
	
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;

	scene = new THREE.Scene();

	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
	
	// Create the camera
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 90;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
	);
	
	// Set the position of the camera
	camera.position.x = 0;
	camera.position.y = 75;
	camera.position.z = 100;
	// there has to be a way to rotate the camera


	// Create the renderer
	renderer = new THREE.WebGLRenderer({ 
		alpha: true, 

		antialias: true 
	});

	// Define the size of the renderer; in this case,
	// it will fill the entire screen
	renderer.setSize(WIDTH, HEIGHT);
	
	// Enable shadow rendering
	renderer.shadowMap.enabled = true;
	
	// Add the DOM element of the renderer to the 
	// container we created in the HTML
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	
	// Listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
	window.addEventListener('resize', handleWindowResize, false);

}

function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

var hemisphereLight, shadowLight;

function create_lights() {
	// sky color, ground color, intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);
	
	// A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel. 
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);

	// Set the direction of the light  
	shadowLight.position.set(150, 350, 350);
	
	// Allow shadow casting 
	shadowLight.castShadow = true;

	// defining the visible area of the projected shadow
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

	// define the resolution of the shadow; the higher the better, 
	// but also the more expensive and less performant
	shadowLight.shadow.mapSize.width = 1024;
	shadowLight.shadow.mapSize.height = 1024;
	
	// to activate the lights, just add them to the scene
	scene.add(hemisphereLight);  
	scene.add(shadowLight);
}

// First let's define a Sea object :
Sea = function(){
	
	// radius top, radius bottom, height, number of segments on the radius, number of segments vertically
	var geom = new THREE.CylinderGeometry(600,600, 4200,40,10);
	// var geom = new THREE.BoxGeometry(200,200,200);

	
	// rotate the geometry on the x axis
	geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	
	// create the material 
	var material = new THREE.MeshPhongMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:.8,
		shading:THREE.FlatShading,
	});

	// To create an object in Three.js, we have to create a mesh 
	// which is a combination of a geometry and some material
	this.mesh = new THREE.Mesh(geom, material);

	// Allow the sea to receive shadows
	this.mesh.receiveShadow = true; 
}

// Instantiate the sea and add it to the scene:

var sea;

function create_sea(){
	sea = new Sea();

	// push it a little bit at the bottom of the scene
	sea.mesh.position.y = -600;

	// add the mesh of the sea to the scene
	scene.add(sea.mesh);
}


Cloud = function(){
	// Create an empty container that will hold the different parts of the cloud
	this.mesh = new THREE.Object3D();
	
	// create a cube geometry;
	// this shape will be duplicated to create the cloud
	var geom = new THREE.BoxGeometry(20,20,20);
	
	// create a material
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.pink,  
	});
	
	// duplicate the geometry a random number of times
	// random is only for clouds. Rest others have better definitions

	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){
		
		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat); 
		
		// set the position and the rotation of each cube randomly
		m.position.x = Math.random()*10;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;

		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		
		// set the size of the cube randomly
		var s = .1 ;
		m.scale.set(s,s,s);
		
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		
		// add the cube to the container we first created
		this.mesh.add(m);
	} 
}



Sky = function(){
	// Create an empty container
	this.mesh = new THREE.Object3D();
	
	// choose a number of clouds to be scattered in the sky
	this.nClouds = 20;
	
	// To distribute the clouds consistently,
	// we need to place them according to a uniform angle
	var stepAngle = Math.PI*2 / this.nClouds;
	
	// create the clouds
	for(var i=0; i<this.nClouds; i++){
		var c = new Cloud();
	 
		// set the rotation and the position of each cloud;
		// for that we use a bit of trigonometry
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = 550 + Math.random()*200; // this is the distance between the center of the axis and the cloud itself

		// Trigonometry!!! I hope you remember what you've learned in Math :)
		// in case you don't: 
		// we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
		c.mesh.position.y = Math.sin(a)*h;
		c.mesh.position.x = Math.cos(a)*h;

		// rotate the cloud according to its position
		c.mesh.rotation.z = a + Math.PI/2;
		// c.mesh.rotation.z = 0;

		// for a better result, we position the clouds 
		// at random depths inside of the scene
		c.mesh.position.z = Math.random()%40; 
		
		// we also set a random scale for each cloud
		var s = 1+Math.random()*2;
		c.mesh.scale.set(s,s,s);

		// do not forget to add the mesh of each cloud in the scene
		this.mesh.add(c.mesh);  
	}

}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function create_sky(){
	sky = new Sky();
	sky.mesh.position.y = -600;
	scene.add(sky.mesh);
}



// now we will go on and try to make the plane and the enemies

var enemy_plane = function() {
	this.mesh = new THREE.Object3D();
	var geomCockpit = new THREE.BoxGeometry(80,50,50,1,1,1);
	var matCockpit = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});

	var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
	cockpit.castShadow = true;
	cockpit.receiveShadow = true;
	this.mesh.add(cockpit);

	var engine_geometry = new THREE.BoxGeometry(20,50,50,1,1,1);
	var engine_material = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
	var engine = new THREE.Mesh(engine_geometry, engine_material);
	engine.position.x = -40;
	engine.castShadow = true;
	engine.receiveShadow = true;
	this.mesh.add(engine);

	var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
	var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
	var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
	tailPlane.position.set(35,25,0);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	this.mesh.add(tailPlane);

	this.pilot = new Pilot();
  	this.pilot.mesh.position.set(-10,-27,0);
  	this.mesh.add(this.pilot.mesh);

  	var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
	var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;
	
	// blades
	var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
	var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
	
	var blade = new THREE.Mesh(geomBlade, matBlade);
	blade.position.set(8,0,0);
	blade.castShadow = true;
	blade.receiveShadow = true;
	this.propeller.add(blade);
	this.propeller.position.set(50,0,0);
	this.mesh.add(this.propeller);
}



enemies = function(){
	// Create an empty container
	this.mesh = new THREE.Object3D();
	
	// choose a number of clouds to be scattered in the sky
	this.nEnemies = 18;
	
	// To distribute the clouds consistently,
	// we need to place them according to a uniform angle
	var stepAngle = Math.PI*2 / this.nEnemies;
	
	// create the clouds
	for(var i=0; i<this.nEnemies; i++){
		var c = new enemy_plane();
		console.log("new plane made");
	 
		// set the rotation and the position of each cloud;
		// for that we use a bit of trigonometry
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = 600 + Math.random()*100; // this is the distance between the center of the axis and the cloud itself

		// Trigonometry!!! I hope you remember what you've learned in Math :)
		// in case you don't: 	
		// we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
		c.mesh.position.y = Math.sin(a)*h;
		c.mesh.position.x = Math.cos(a)*h;

		// rotate the cloud according to its position
		c.mesh.rotation.z = a + Math.PI/2;
		// c.mesh.rotation.z = 0;

		// for a better result, we position the clouds 
		// at random depths inside of the scene
		c.mesh.position.z = Math.random()%40; 
		
		// we also set a random scale for each cloud
		var s = 0.25;
		c.mesh.scale.set(s,s,s);

		// do not forget to add the mesh of each cloud in the scene
		this.mesh.add(c.mesh);  
	}

}


var enemy_list;

function create_enemies(){
	enemy_list = new enemies();
	enemy_list.mesh.position.y = -600;
	scene.add(enemy_list.mesh);
}

var Bullet = function(){
	
	// radius top, radius bottom, height, number of segments on the radius, number of segments vertically
	var geom = new THREE.CylinderGeometry(2,2, 4,4,14);
	// var geom = new THREE.BoxGeometry(200,200,200);

	
	// rotate the geometry on the x axis
	// geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	
	// create the material 
	var material = new THREE.MeshPhongMaterial({
		color:Colors.red,
		transparent:true,
		opacity:.8,
		shading:THREE.FlatShading,
	});

	// To create an object in Three.js, we have to create a mesh 
	// which is a combination of a geometry and some material
	this.mesh = new THREE.Mesh(geom, material);

	// Allow the sea to receive shadows
	this.mesh.receiveShadow = true; 
}

// Instantiate the sea and add it to the scene:

var bullet_shot;

var friendly_bullets = [];
var enemy_bullets = [];



var AirPlane = function() {
	
	this.mesh = new THREE.Object3D();
	
	var geomCockpit = new THREE.BoxGeometry(80,50,50,1,1,1);
	var matCockpit = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});

	var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
	cockpit.castShadow = true;
	cockpit.receiveShadow = true;
	this.mesh.add(cockpit);

	// Create the engine
	var engine_geometry = new THREE.BoxGeometry(20,50,50,1,1,1);
	var engine_material = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
	var engine = new THREE.Mesh(engine_geometry, engine_material);
	engine.position.x = 40;
	engine.castShadow = true;
	engine.receiveShadow = true;
	this.mesh.add(engine);
	
	// Create the tail
	var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
	var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
	var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
	tailPlane.position.set(-35,25,0);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	this.mesh.add(tailPlane);
	
	// Create the wing
	var geomSideWing = new THREE.BoxGeometry(40,8,150,1,1,1);
	var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
	var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
	sideWing.castShadow = true;
	sideWing.receiveShadow = true;
	this.mesh.add(sideWing);
	
	// propeller
	var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
	var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;
	
	// blades
	var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
	var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
	
	var blade = new THREE.Mesh(geomBlade, matBlade);
	blade.position.set(8,0,0);
	blade.castShadow = true;
	blade.receiveShadow = true;
	this.propeller.add(blade);
	this.propeller.position.set(50,0,0);
	this.mesh.add(this.propeller);

	this.pilot = new Pilot();
  	this.pilot.mesh.position.set(-10,27,0);
  	this.mesh.add(this.pilot.mesh);

	
};

AirPlane.prototype.shoot = function(){
	
	// initialize a missile object and let it go in it's direction
	var bullet_shot = new Bullet();

	// push it a little bit at the bottom of the scene
	bullet_shot.mesh.position.x = this.mesh.position.x;
	bullet_shot.mesh.position.y = this.mesh.position.y;
	bullet_shot.mesh.position.z = this.mesh.position.z;
	// they'll be updated to be the current position of the guy shooting them

	// add the mesh of the sea to the scene
	scene.add(bullet_shot.mesh);
	friendly_bullets.push(bullet_shot);
}

var airplane;

function create_plane(){ 
	airplane = new AirPlane();
	airplane.mesh.scale.set(.25,.25,.25);
	airplane.mesh.position.y = 100;
	scene.add(airplane.mesh);
}




var Pilot = function(){
	this.mesh = new THREE.Object3D();
	this.mesh.name = "pilot";
	
	// angleHairs is a property used to animate the hair later 
	this.angleHairs=0;

	// Body of the pilot
	var bodyGeom = new THREE.BoxGeometry(15,15,15);
	var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	var body = new THREE.Mesh(bodyGeom, bodyMat);
	body.position.set(2,-12,0);
	this.mesh.add(body);

	// Face of the pilot
	var faceGeom = new THREE.BoxGeometry(10,10,10);
	var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
	var face = new THREE.Mesh(faceGeom, faceMat);
	this.mesh.add(face);

	// Hair element
	var hairGeom = new THREE.BoxGeometry(4,4,4);
	var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
	var hair = new THREE.Mesh(hairGeom, hairMat);
	// Align the shape of the hair to its bottom boundary, that will make it easier to scale.
	hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
	
	// create a container for the hair
	var hairs = new THREE.Object3D();

	// create a container for the hairs at the top 
	// of the head (the ones that will be animated)
	this.hairsTop = new THREE.Object3D();

	// create the hairs at the top of the head 
	// and position them on a 3 x 4 grid
	for (var i=0; i<12; i++){
		var h = hair.clone();
		var col = i%3;
		var row = Math.floor(i/3);
		var startPosZ = -4;
		var startPosX = -4;
		h.position.set(startPosX + row*4, 0, startPosZ + col*4);
		this.hairsTop.add(h);
	}
	hairs.add(this.hairsTop);

	// create the hairs at the side of the face
	var hairSideGeom = new THREE.BoxGeometry(12,4,2);
	hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
	var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
	var hairSideL = hairSideR.clone();
	hairSideR.position.set(8,-2,6);
	hairSideL.position.set(8,-2,-6);
	hairs.add(hairSideR);
	hairs.add(hairSideL);

	// create the hairs at the back of the head
	var hairBackGeom = new THREE.BoxGeometry(2,8,10);
	var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
	hairBack.position.set(-1,-4,0)
	hairs.add(hairBack);
	hairs.position.set(-5,5,0);

	this.mesh.add(hairs);

	var glassGeom = new THREE.BoxGeometry(5,5,5);
	var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
	var glassR = new THREE.Mesh(glassGeom,glassMat);
	glassR.position.set(6,0,3);
	var glassL = glassR.clone();
	glassL.position.z = -glassR.position.z

	var glassAGeom = new THREE.BoxGeometry(11,1,11);
	var glassA = new THREE.Mesh(glassAGeom, glassMat);
	this.mesh.add(glassR);
	this.mesh.add(glassL);
	this.mesh.add(glassA);

	var earGeom = new THREE.BoxGeometry(2,3,2);
	var earL = new THREE.Mesh(earGeom,faceMat);
	earL.position.set(0,0,-6);
	var earR = earL.clone();
	earR.position.set(0,0,6);
	this.mesh.add(earL);
	this.mesh.add(earR);
}

// move the hair
Pilot.prototype.updateHairs = function(){
	
	// get the hair
	var hairs = this.hairsTop.children;

	// update them according to the angle angleHairs
	var l = hairs.length;
	for (var i=0; i<l; i++){
		var h = hairs[i];
		// each hair element will scale on cyclical basis between 75% and 100% of its original size
		h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
	}
	// increment the angle for the next frame
	this.angleHairs += 0.16;
}

var main_score = 0.0;
var health = 100;
var game_play = new Boolean(true);

function update_score(amount){ 
	main_score += amount;
}


function update_health() {
	health -= 1;

	if ( health == 0){
		game_play = false;
	}
}


var game_speed = 0.00001

function updateFriendlyBullets(){
	// we call the friendly bullets ,and advance them all one by one
	for(var i = 0, size = friendly_bullets.length; i < size ; i++){
   		friendly_bullets[i].mesh.position.x += 5;

   		// if (friendly_bullets[i].position.x >= 400){
   		// 	delete friendly_bullets[i];
   			// friendly_bullets.splice(i, 1);
   		// }
   } 
}

function run_game_loop(){
	// Rotate the propeller, the sea and the sky
	update_score(0.0001);
	var displayScore = document.getElementById("duration");
	displayScore.innerHTML = 'Score : ' + main_score.toFixed(4) + '     Health : ' + health.toFixed() ;
	
	airplane.propeller.rotation.x += 0.3;
	sea.mesh.rotation.z += .005;
	sky.mesh.rotation.z += .01;
	enemy_list.mesh.rotation.z += .006 + game_speed;

	game_speed += 0.00000001;

	airplane.pilot.updateHairs();

	// render the scene
	renderer.render(scene, camera);

	updatePlane();
	updateFriendlyBullets();

	// call the loop function again
	if (!game_play){
		return;
	}
	requestAnimationFrame(run_game_loop);

}

window.onload = function(){
    var space_bar = 32;
  	var w = 87;
  	var s = 83;
  	var a = 65;
    window.onkeydown = function(key_press){
        if(key_press.keyCode === space_bar){
        	game_play = !game_play;
        	// this way , we can pause the game
        }
        else if(key_press.keyCode === s){
        	airplane.mesh.position.z -= 5;
        	if (airplane.mesh.position.z <= -500){
        		airplane.mesh.position.z = -500 ;
        	}
        }
        else if(key_press.keyCode === w){
        	airplane.mesh.position.z += 5;
        	if (airplane.mesh.position.z >= camera.position.z-20){
        		airplane.mesh.position.z = camera.position.z-20;
        	}
        }
        else if(key_press.keyCode === a){
        	// we have to shoot
        	airplane.shoot();
        }
    };
};    


function updatePlane(){	
	var targetX = normalize(mousePos.x, -1, 1, -100, 100);
	var targetY = normalize(mousePos.y, -1, 1, 25, 175);

	// update the airplane's position
	airplane.mesh.position.y = targetY;
	airplane.mesh.position.x = targetX;
	airplane.propeller.rotation.x += 0.3;

	// Move the plane at each frame by adding a fraction of the remaining distance
	// Rotate the plane proportionally to the remaining distance
	airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*0.128;
	airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*0.0064;

}

function normalize(v,vmin,vmax,tmin, tmax){

	var nv = Math.max(Math.min(v,vmax), vmin);
	var dv = vmax-vmin;
	var pc = (nv-vmin)/dv;
	var dt = tmax-tmin;
	var tv = tmin + (pc*dt);
	return tv;

}