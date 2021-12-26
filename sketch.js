let planeSize = 100;
let platform;
var MAX_STEP_ELEVATION = 1.15;
var MAX_OVER_STEPS = 2;
// player player parameters
var player = {
	airborne: false,
	position: new THREE.Vector3(), 
	velocity: new THREE.Vector3(),
	rotation: new THREE.Vector2(), 
	spinning: new THREE.Vector2(),
	options :{
		step : 0.5
	}
};
player.position.x = 0;
player.position.y =  0;
player.position.z = 0;
var previousPosition= {x:0,y:0,z:0};
var numberOverSteps = 0;
//player.position.y = 0;
// game systems code

var collidableMeshList = [];
var keyboardControls = ( function () {
		//var keys = { SP: 32, W: 87, A: 65, S: 83, D: 68, UP: 38, LT: 37, DN: 40, RT: 39 };
	var keys = { SP: 32, W: 87, A: 65, Z: 90, Q: 81, S: 83, D: 68, UP: 38, LT: 37, DN: 40, RT: 39 };

	var keysPressed = {};
	( function ( watchedKeyCodes ) {
		var handler = function ( down ) {
			return function ( e ) {
				var index = watchedKeyCodes.indexOf( e.keyCode );
				if ( index >= 0 ) {
					keysPressed[ watchedKeyCodes[ index ] ] = down;
					e.preventDefault();
				}
			};
		};
		window.addEventListener( "keydown", handler( true ), false );
		window.addEventListener( "keyup", handler( false ), false );
	} )( [
		keys.SP, keys.Z, keys.W, keys.A, keys.Q, keys.S, keys.D, keys.UP, keys.LT, keys.DN, keys.RT
	] );
	var forward = new THREE.Vector3();
	var sideways = new THREE.Vector3();
	return function () {
		if ( ! player.airborne ) {
			// look around
			var sx = keysPressed[ keys.UP ]? 0.03 : ( keysPressed[ keys.DN ] ? - 0.03 : 0 );
			var sy = keysPressed[ keys.LT ] || keysPressed[ keys.Q ] || keysPressed[ keys.A]  ? 0.03 : ( keysPressed[ keys.RT ] || keysPressed[ keys.D ] ? - 0.03 : 0 );
			if ( Math.abs( sx ) >= Math.abs( player.spinning.x ) ) player.spinning.x = sx;
			if ( Math.abs( sy ) >= Math.abs( player.spinning.y ) ) player.spinning.y = sy;
			// move around
			forward.set( Math.sin( player.rotation.y ), 0, Math.cos( player.rotation.y ) );
			sideways.set( forward.z, 0, - forward.x );
			forward.multiplyScalar( keysPressed[ keys.Z ] || keysPressed[ keys.W ] ? - player.options.step : ( keysPressed[ keys.S ] ? player.options.step : 0 ) );
			sideways.multiplyScalar( 0 );
			var combined = forward.add( sideways );
			if ( Math.abs( combined.x ) >= Math.abs( player.velocity.x ) ) player.velocity.x = combined.x;
			if ( Math.abs( combined.y ) >= Math.abs( player.velocity.y ) ) player.velocity.y = combined.y;
			if ( Math.abs( combined.z ) >= Math.abs( player.velocity.z ) ) player.velocity.z = combined.z;
			//jump
			var vy = keysPressed[ keys.SP ] ? 0.7 : 0;
			player.velocity.y += vy;
		}
	};
} )();

function checkCollision(){
        var MovingCube = scene.getObjectByName('cube');
        var originPoint = MovingCube.position.clone();

		var forward = new THREE.Vector3();
		var sideways = new THREE.Vector3();
		forward.set( Math.sin( player.rotation.y ), 0, Math.cos( player.rotation.y ) );
		sideways.set( forward.z, 0, - forward.x );
		
	for (var vertexIndex = 0; vertexIndex < MovingCube.geometry.vertices.length; vertexIndex++)
	{		
		var localVertex = MovingCube.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( MovingCube.matrix );
		var directionVector = globalVertex.sub( MovingCube.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( collidableMeshList );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
 			forward.multiplyScalar( 0.75 );
			sideways.multiplyScalar( 0 );
			var combined = forward.add( sideways );
			if ( Math.abs( combined.x ) >= Math.abs( player.velocity.x ) ) player.velocity.x = combined.x;
			if ( Math.abs( combined.y ) >= Math.abs( player.velocity.y ) ) player.velocity.y = combined.y;
			if ( Math.abs( combined.z ) >= Math.abs( player.velocity.z ) ) player.velocity.z = combined.z;
			
				keepTogether(player,cube)
		}
			
	}	

}

function getPlayerAltitude() {
   var x = Math.floor(player.position.x /2400 * 250 + 0.5);
   var y = Math.floor(player.position.z /2400 * 250 + 0.5);
    let result = null;
	

	let arrAlt = platform.geometry.userData.heights.filter(function (position) {
		return position.x === x && position.y === y;
	});
	if (arrAlt.length > 0) {
		result = arrAlt[0].h*1.25 +8;
		if(previousPosition.y >0 && result > 0){
			if(result/previousPosition.y > MAX_STEP_ELEVATION) {
				numberOverSteps++;
				if(numberOverSteps>= MAX_OVER_STEPS){
					numberOverSteps =0;
					result = null;
				}
			}
		}else{
			numberOverSteps =0;
		}

	} 
    return result;
}


function keepTogether(player,cube){
	cube.position.x = player.position.x;
	cube.position.y = player.position.y;
	cube.position.z = player.position.z;

	cube.rotation.x = player.rotation.x;
	cube.rotation.y = player.rotation.y;
}

var applyPhysics = ( function () {
	var timeStep = 5;
	var timeLeft = timeStep + 1;
	var angles = new THREE.Vector2();
	var displacement = new THREE.Vector3();
	return function ( dt ) {
		platform = scene.getObjectByName( "platform", true );
		if ( platform ) {
			timeLeft += dt;
			// run several fixed-step iterations to approximate varying-step
			dt = 3;
			while ( timeLeft >= dt ) {
             
				let currentAltitude = getPlayerAltitude();
				if(currentAltitude != null){
					player.position.y = currentAltitude; 
					previousPosition = {...player.position};
				}else{
					player.position.x =  previousPosition.x;
					player.position.y=  previousPosition.y;
					player.position.z =  previousPosition.z;
				}
				//player.position.y = getY(player.position.x, player.position.z);
				var time = 0.3, damping = 0.93, gravity = 0.01, tau = 2 * Math.PI;
				player.airborne = false;
				/*
				if(player.position.y > -1 && player.position.y < 3){
					player.position.y = 0;
					player.velocity.y = 0;
					player.airborne = false;
				}*/
				//if(player.airborne) player.velocity.z = 0;
				if ( player.airborne ) player.velocity.y -= gravity;
				angles.copy( player.spinning ).multiplyScalar( time );
				if ( ! player.airborne ) player.spinning.multiplyScalar( damping );
				displacement.copy( player.velocity ).multiplyScalar( time );
				if ( ! player.airborne ) player.velocity.multiplyScalar( damping );
				player.rotation.add( angles );
				player.position.add( displacement );
				// limit the tilt at ±0.4 radians
				player.rotation.x = Math.max( - 0.4, Math.min( + 0.4, player.rotation.x ) );
				// wrap horizontal rotation to 0...2π
				player.rotation.y += tau;
				player.rotation.y %= tau;
				timeLeft -= dt;
				keepTogether(player,cube)
			}
		}
	};
} )();

var updateCamera = ( function () {
	var euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
	return function () {
		euler.x = player.rotation.x;
		euler.y = player.rotation.y;
		camera.quaternion.setFromEuler( euler );
		camera.position.copy( player.position );
		camera.position.y += 3.0;
	};
} )();
// init 3D stuff
var wallGeometry = new THREE.CubeGeometry( 17, 8, 3, 1, 1, 1 );
var wallMaterial = new THREE.MeshBasicMaterial( {color: 0x554400} );
var wireMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe:true } );
	
var renderer = new THREE.WebGLRenderer( { antialias: true } );

renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
//var camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 9000 );
var scene = new THREE.Scene();


var envMap = new THREE.CubeTextureLoader().load( [
	'textures/cube/skybox/px.jpg', // right
	'textures/cube/skybox/nx.jpg', // left
	'textures/cube/skybox/py.jpg', // top
	'textures/cube/skybox/ny.jpg', // bottom
	'textures/cube/skybox/pz.jpg', // back
	'textures/cube/skybox/nz.jpg' // front
] );
envMap.format = THREE.RGBFormat;
scene.background = envMap;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
light.position.set( 0.5, 0.5, 0 ); 			//default; light shining from top
light.castShadow = true;            // default false
scene.add( light );

//Set up shadow properties for the light
light.shadow.mapSize.width = 512;  // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5;    // default
light.shadow.camera.far = 500;     // default

//Create a sphere that cast shadows (but does not receive them)
var sphereGeometry = new THREE.SphereBufferGeometry( 5, 32, 32 );
var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.position.set( 0, 0, -25);
sphere.castShadow = true; //default is false
sphere.receiveShadow = false; //default
scene.add( sphere );
collidableMeshList.push(sphere)

//Create a plane that receives shadows (but does not cast them)
addGround(scene,"platform");
/*
var planeGeometry = new THREE.PlaneGeometry( planeSize, planeSize, planeSize * 0.5, planeSize * 0.5 );
var planeMaterial = new THREE.MeshStandardMaterial( { wireframe: true } )//{ color: 0x00aa00 }
var plane = new THREE.Mesh( planeGeometry, planeMaterial );
       for ( var i = 0; i<plane.geometry.vertices.length; i++ ) {
            plane.geometry.vertices[i].z = data[i] * .1;
 
        }
		*/
		/*
plane.receiveShadow = true;
plane.material.side = THREE.DoubleSide;
plane.rotation.x = 1.5708;
scene.add( plane );
*/

//plane.name = "platform";

var wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(-20, 0, 100);
wall.rotation.y = 3.14159 / 3;
wall.receiveShadow = true;
scene.add(wall);
collidableMeshList.push(wall);

var cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.name = 'cube';
scene.add(cube);
keepTogether(player,cube)

// start the game
var start = function ( gameLoop, gameViewportSize ) {
	var resize = function () {
		var viewport = gameViewportSize();
		renderer.setSize( viewport.width, viewport.height );
		camera.aspect = viewport.width / viewport.height;
		camera.updateProjectionMatrix();
	};
	window.addEventListener( 'resize', resize, false );
	resize();
	var lastTimeStamp;
	var render = function ( timeStamp ) {
		var timeElapsed = lastTimeStamp ? timeStamp - lastTimeStamp : 0;
		lastTimeStamp = timeStamp;
		// call our game loop with the time elapsed since last rendering, in ms
		gameLoop( timeElapsed );
		renderer.render( scene, camera );
		requestAnimationFrame( render );
	};
	requestAnimationFrame( render );
};
var gameLoop = function ( dt ) {
	keyboardControls();
	checkCollision();
	applyPhysics( dt );
	updateCamera();
};
var gameViewportSize = function () {
	return {
		width: window.innerWidth, height: window.innerHeight
	};
};
start( gameLoop, gameViewportSize );
