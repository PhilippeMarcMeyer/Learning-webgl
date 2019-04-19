 // Make the img global so we can easily access the width and height.
var img;

// How much to scale the height of the heightfield.
var height_scale = 200;

 
 //To get the pixels, draw the image onto a canvas. From the canvas get the Pixel (R,G,B,A)
function getTerrainPixelData()
{
  img = document.getElementById("landscape-image");
  var canvas = document.getElementById("canvas");
  
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

  var data = canvas.getContext('2d').getImageData(0,0, img.width, img.height).data;
  var normPixels = []

  for (var i = 0, n = data.length; i < n; i += 4) {
    // get the average value of R, G and B.
    normPixels.push((data[i] + data[i+1] + data[i+2]) / 3);
  }

  return normPixels;
}

function addGround(scene,name) {
  terrain = getTerrainPixelData();  

  //var geometry = new THREE.PlaneGeometry(2400, 2400*img.width/img.height, img.height-1, img.width-1);
  var geometry = new THREE.PlaneGeometry(2400*img.width/img.height, 2400, img.width-1, img.height-1);
  var material = new THREE.MeshLambertMaterial({
    color: 0xccccff,
    wireframe: false
  });

  // keep in mind, that the plane has more vertices than segments. If there's one segment, there's two vertices, if
  // there's 10 segments, there's 11 vertices, and so forth. 
  // The simplest is, if like here you have 100 segments, the image to have 101 pixels. You don't have to worry about
  // "skewing the landscape" then..

  // to check uncomment the next line, numbers should be equal
  //console.log("length: " + terrain.length + ", vertices length: " + geometry.vertices.length);

  for (var i = 0, l = geometry.vertices.length; i < l; i++)
  {
    var terrainValue = terrain[i] / 255;
    geometry.vertices[i].z = geometry.vertices[i].z + terrainValue * height_scale ;
  }
  
  // might as well free up the input data at this point, or I should say let garbage collection know we're done.
  terrain = null;

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  var plane = new THREE.Mesh(geometry, material);

  plane.position = new THREE.Vector3(0,20,0);
  // rotate the plane so up is where y is growing..

  var q = new THREE.Quaternion();
  q.setFromAxisAngle( new THREE.Vector3(-1,0,0), 90 * Math.PI / 180 );
  plane.quaternion.multiplyQuaternions( q, plane.quaternion );
	plane.name = name;
  scene.add(plane)
}