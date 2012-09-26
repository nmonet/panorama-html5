
window.PanoramaViever = (function (window, document, undefined) {
	
	
	var PanoramaViever = { x : 0, y: 0}, images = [], i = 0, ctx,
		isUserInteracting = false, canvasX = 0,  canvasY = 0, fov = 1,
		onMouseDownMouseX = 0,
		onMouseDownMouseY = 0,
		onOldMouseDownMouseX = 0,
		onOldMouseDownMouseY = 0;
	
	PanoramaViever.init = function (args) {
		
		var args = args || {},
		baseImage = args.baseImage || 'panorama.jpg',
		nbImage = args.nbImage || 6,
		containerSelector = args.containerSelector || '#canvas',
		canvas = $(containerSelector);
		
		PanoramaViever.hauteur = args.hauteur || 768;
		PanoramaViever.largeur = args.largeur || 1024;
				
		ctx = canvas[0].getContext("2d");
		
		canvas.attr("height", window.innerHeight);
		canvas.attr("width", window.innerWidth);
		canvas.css('height', window.innerHeight + 'px');
		canvas.css('width', window.innerWidth + 'px');
		
		if (nbImage == 1) {
			var image = new Image();
			image.onload = function() {
				ctx.drawImage(image, 0, 0);
			};
			image.src = baseImage;			
			images.push(image);
		} else {
		for (i = 0; i < nbImage; i++) {
			var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));
			var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
			
			var image = new Image();
			image.onload = function() {
				ctx.drawImage(image, i * image.width, 0);
			};
			image.src = imageName + '_' + (i+1) + imageExtension;			
			images.push(image);
		}
		}
		
		if (document.addEventListener) {
		document.addEventListener('mousedown', onDocumentMouseDown, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('mousewheel', onDocumentMouseWheel, false);
		document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
		document.addEventListener('keyup', onDocumentKeyUp, false);
		}
	}
	
	PanoramaViever.setX = function(deltaX) {
		PanoramaViever.x = PanoramaViever.x + deltaX;
		if (PanoramaViever.x > PanoramaViever.largeur) {
			PanoramaViever.x = 0;
		}
		if (PanoramaViever.x < -PanoramaViever.largeur) {
			PanoramaViever.x = 0;
		}
	}
	
	PanoramaViever.setY = function(deltaY) {
		PanoramaViever.y = PanoramaViever.y + deltaY;
		if (PanoramaViever.y > 0) {
			PanoramaViever.y = 0;
		}
		
		// Need to find a lower limit that take in account fov
		var oo = window.innerHeight - PanoramaViever.y;
		var oo2 = PanoramaViever.hauteur * fov - window.innerHeight;
		console.log(oo + '    ' +oo2);
		if (oo > PanoramaViever.hauteur * fov) {
			PanoramaViever.y = - (oo2);
		}		
	}
	
	function onDocumentMouseDown(event) {
		
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
		onOldMouseDownMouseX = onPointerDownPointerX;
		onOldMouseDownMouseY = onPointerDownPointerY;
		
		console.log('[onDocumentMouseDown] onPointerDownPointerX : '+onPointerDownPointerX + ' ,onPointerDownPointerY' + onPointerDownPointerY);
	}
	
	function onDocumentMouseMove(event) {
		if (isUserInteracting) {
			PanoramaViever.setX(event.clientX - onOldMouseDownMouseX);
			PanoramaViever.setY(event.clientY - onOldMouseDownMouseY);
			onOldMouseDownMouseX = event.clientX;
			onOldMouseDownMouseY = event.clientY;
			render();
		}
	}
	
	function onDocumentMouseUp(event) {		
		isUserInteracting = false;
	}
	
	function onDocumentMouseWheel(event) {
		
		// WebKit
		
		if (event.wheelDeltaY) {
			
			fov -= event.wheelDeltaY * 0.005;
			
			// Opera / Explorer 9
			
		} else if (event.wheelDelta) {
			
			fov -= event.wheelDelta * 0.005;
			
			// Firefox
			
		} else if (event.detail) {
			
			fov += event.detail * 0.1;
			
		}
		render();
	}
	
	function onDocumentKeyUp(event) {
	
	}
	
	function zoomIn(amount) {
		console.log('zoom In');
	}
	
	function zoomOut(amount) {
	}
	
	function render() {
		console.log('X = '+PanoramaViever.x + 'Y = '+PanoramaViever.y + ' , fov = '+fov);
		ctx.setTransform(fov, 0, 0, fov, 0, 0);
		ctx.drawImage(images[0], PanoramaViever.x, PanoramaViever.y);
		ctx.drawImage(images[0], PanoramaViever.x + PanoramaViever.largeur, PanoramaViever.y);
		ctx.drawImage(images[0], PanoramaViever.x - PanoramaViever.largeur, PanoramaViever.y);
	}
	
	
	return PanoramaViever;
	
})(this, this.document);
