
window.Panorama = (function (window, document, undefined) {
	
	var camera,
	scene,
	renderer,
	textureSize,
	Panorama = {};
	
	var fov = 50,
	texture_placeholder,
	isUserInteracting = false,
	onMouseDownMouseX = 0,
	onMouseDownMouseY = 0,
	lon = 0,
	onMouseDownLon = 0,
	lat = 0,
	onMouseDownLat = 0,
	phi = 0,
	theta = 0;
	
	Panorama.init = function (args) {
		
		var args = args || {},
		container,
		containerSelector = args.containerSelector || '#container',
		baseImage = args.baseImage || 'panorama.jpg',
		nbImage = args.nbImage || 6,
		webgl = Modernizr.webgl;
		
		container = $(containerSelector);
		
		camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1100);
		
		camera.target = new THREE.Vector3(0, 0, 0);
		
		scene = new THREE.Scene();
		
		if (webgl) {
			renderer = new THREE.WebGLRenderer();
			writeInConsole('Using WebGLRenderer')
		} else {
			renderer = new THREE.CanvasRenderer();
			writeInConsole('Using CanvasRenderer')
		}
		renderer.setSize(window.innerWidth, window.innerHeight);
		
		container.append(renderer.domElement);
		var rotationY = 0;
		for (i = 0; i < nbImage; i++) {
			var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));
			var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
			var mat = new THREE.MeshBasicMaterial({
					map : THREE.ImageUtils.loadTexture(imageName + '_' + (i+1) + imageExtension),
					wireframe : false
				});
			
			if(!webgl) {
				mat.overdraw = true; //seamless texture for canavas only ?
			}
			mesh = new THREE.Mesh(generateArcCylinderGeometry(493, 493, 384, 40, 40, false, 2 * Math.PI / nbImage), mat);
			mesh.rotation.y -= rotationY;
			rotationY += 2 * Math.PI / nbImage;
			
			mesh.scale.x = -1;
			scene.add(mesh);
		}
		/*
		var mat1 = new THREE.MeshBasicMaterial({
				map : THREE.ImageUtils.loadTexture('petit_Aiguille de Varan_1.jpg'),
				wireframe : false
			});
		var mat2 = new THREE.MeshBasicMaterial({
				map : THREE.ImageUtils.loadTexture('petit_Aiguille de Varan_2.jpg'),
				wireframe : false
			});
		mat1.overdraw = true; //seamless texture for canavas only ?
		mat2.overdraw = true; //seamless texture for canavas only ?
		
		mesh1 = new THREE.Mesh(generateArcCylinderGeometry(493, 493, 384, 40, 40, false, Math.PI), mat1);
		
		mesh2 = new THREE.Mesh(generateArcCylinderGeometry(493, 493, 384, 20, 20, false, Math.PI), mat2);
		mesh2.rotation.y -= Math.PI;
		
		mesh1.scale.x = -1;
		mesh2.scale.x = -1;
		scene.add(mesh1);
		scene.add(mesh2);*/
		
		document.addEventListener('mousedown', onDocumentMouseDown, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('mousewheel', onDocumentMouseWheel, false);
		document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
		document.addEventListener('keyup', onDocumentKeyUp, false);
		
	}
	
	function writeInConsole(text) {
		if (typeof console !== 'undefined') {
			console.log(text);
		} else {
			//alert(text);
		}
	}
	
	function onDocumentMouseDown(event) {
		
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
		
		onPointerDownLon = lon;
		onPointerDownLat = lat;
		
	}
	
	function onDocumentMouseMove(event) {
		
		if (isUserInteracting) {
			
			lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
			lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
			
		}
	}
	
	function onDocumentMouseUp(event) {
		
		isUserInteracting = false;
		
	}
	
	function onDocumentMouseWheel(event) {
		
		// WebKit
		
		if (event.wheelDeltaY) {
			
			fov -= event.wheelDeltaY * 0.05;
			
			// Opera / Explorer 9
			
		} else if (event.wheelDelta) {
			
			fov -= event.wheelDelta * 0.05;
			
			// Firefox
			
		} else if (event.detail) {
			
			fov += event.detail * 1.0;
			
		}
		
		camera.projectionMatrix = new THREE.Matrix4().makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
		render();
		
	}
	
	function animate() {
		requestAnimationFrame(animate);
		render();
	}
	
	Panorama.animate = animate;
	
	function onDocumentKeyUp(event) {
		// override default action
		event.preventDefault();
		
		// record key pressed
		keynumber = event.keycode;
		if (event.which) {
			keynumber = event.which;
		}
		
		// if minus key is pressed
		if (keynumber == 109 || keynumber == 189 || keynumber == 17) {
			zoomOut(1);
		}
		
		// if plus key is pressed
		if (keynumber == 107 || keynumber == 187 || keynumber == 16) {
			zoomIn(1)
		}
	}
	
	function zoomIn(amount) {
		if (fov >= 40) {
			fov -= amount;
			camera.projectionMatrix = new THREE.Matrix4().makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
			render();
		}
		// keep field of view within bounds
		if (fov < 40) {
			fov = 40;
		} else if (fov > 100) {
			fov = 100;
		}
	}
	
	function zoomOut(amount) {
		if (fov <= 100) {
			fov += amount;
			camera.projectionMatrix = new THREE.Matrix4().makePerspective(fov, window.innerWidth / window.innerHeight, 1, 1100);
			render();
		}
		// keep field of view within bounds
		if (fov < 40) {
			fov = 40;
		} else if (fov > 100) {
			fov = 100;
		}
	}
	
	function render() {
		
		lat = Math.max( - 85, Math.min(85, lat));
		phi = (90 - lat) * Math.PI / 180;
		theta = lon * Math.PI / 180;
		
		camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
		camera.target.y = 500 * Math.cos(phi);
		camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
		
		camera.lookAt(camera.target);
		
		/*
		// distortion
		camera.position.x = - camera.target.x;
		camera.position.y = - camera.target.y;
		camera.position.z = - camera.target.z;
		 */
		
		renderer.render(scene, camera);
		
	}
	
	function generateArcCylinderGeometry(radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded, arcP) {
		var geometry = new THREE.Geometry();
		
		radiusTop = radiusTop !== undefined ? radiusTop : 20;
		radiusBottom = radiusBottom !== undefined ? radiusBottom : 20;
		height = height !== undefined ? height : 100;
		
		var heightHalf = height / 2;
		var segmentsX = segmentsRadius || 8;
		var segmentsY = segmentsHeight || 1;
		var arc = arcP || Math.PI / 6;
		
		var x,
		y,
		vertices = [],
		uvs = [];
		
		for (y = 0; y <= segmentsY; y++) {
			
			var verticesRow = [];
			var uvsRow = [];
			
			var v = y / segmentsY;
			var radius = v * (radiusBottom - radiusTop) + radiusTop;
			
			for (x = 0; x <= segmentsX; x++) {
				
				var u = x / segmentsX;
				
				var vertex = new THREE.Vector3();
				vertex.x = radius * Math.sin(u * arc);
				vertex.y =  - v * height + heightHalf;
				vertex.z = radius * Math.cos(u * arc);
				
				geometry.vertices.push(vertex);
				
				verticesRow.push(geometry.vertices.length - 1);
				uvsRow.push(new THREE.UV(u, 1 - v));
				
			}
			
			vertices.push(verticesRow);
			uvs.push(uvsRow);
			
		}
		
		var tanTheta = (radiusBottom - radiusTop) / height;
		var na,
		nb;
		
		for (x = 0; x < segmentsX; x++) {
			
			if (radiusTop !== 0) {
				
				na = geometry.vertices[vertices[0][x]].clone();
				nb = geometry.vertices[vertices[0][x + 1]].clone();
				
			} else {
				
				na = geometry.vertices[vertices[1][x]].clone();
				nb = geometry.vertices[vertices[1][x + 1]].clone();
				
			}
			
			na.setY(Math.sqrt(na.x * na.x + na.z * na.z) * tanTheta).normalize();
			nb.setY(Math.sqrt(nb.x * nb.x + nb.z * nb.z) * tanTheta).normalize();
			
			for (y = 0; y < segmentsY; y++) {
				
				var v1 = vertices[y][x];
				var v2 = vertices[y + 1][x];
				var v3 = vertices[y + 1][x + 1];
				var v4 = vertices[y][x + 1];
				
				var n1 = na.clone();
				var n2 = na.clone();
				var n3 = nb.clone();
				var n4 = nb.clone();
				
				var uv1 = uvs[y][x].clone();
				var uv2 = uvs[y + 1][x].clone();
				var uv3 = uvs[y + 1][x + 1].clone();
				var uv4 = uvs[y][x + 1].clone();
				
				geometry.faces.push(new THREE.Face4(v1, v2, v3, v4, [n1, n2, n3, n4]));
				geometry.faceVertexUvs[0].push([uv1, uv2, uv3, uv4]);
				
			}
			
		}
		
		geometry.computeCentroids();
		geometry.computeFaceNormals();
		return geometry;
		
	}
	
	return Panorama;
	
})(this, this.document);
