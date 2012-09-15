
window.PanoramaViever = (function (window, document, undefined) {
	
	
	var PanoramaViever = {}, images = [], i = 0, ctx, largeur, hauteur
		isUserInteracting = false, canvasX = 0,
		onMouseDownMouseX = 0,
		onMouseDownMouseY = 0;
	
	PanoramaViever.init = function (args) {
		
		var args = args || {},
		baseImage = args.baseImage || 'panorama.jpg',
		nbImage = args.nbImage || 6,
		hauteur = args.hauteur || 768,		
		largeur = args.largeur || 1024,
		containerSelector = args.containerSelector || '#canvas',
		canvas = $(containerSelector);
				
		ctx = canvas[0].getContext("2d");
		
		canvas.attr("height", window.innerHeight);
		canvas.attr("width", window.innerWidth);
		
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
	
	function onDocumentMouseDown(event) {
		
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
	}
	
	function onDocumentMouseMove(event) {
		if (isUserInteracting) {
			var x = canvasX + event.clientX - onPointerDownPointerX;
			console.log(i + ' ' + images.length + ' -> ' +x);
			ctx.drawImage(images[0], x, 0);			
		}
	}
	
	function onDocumentMouseUp(event) {		
		isUserInteracting = false;
		canvasX = event.clientX - onPointerDownPointerX;
	}
	
	function onDocumentMouseWheel(event) {
		
		// WebKit
		
		if (event.wheelDeltaY) {
			
			//fov -= event.wheelDeltaY * 0.05;
			
			// Opera / Explorer 9
			
		} else if (event.wheelDelta) {
			
			//fov -= event.wheelDelta * 0.05;
			
			// Firefox
			
		} else if (event.detail) {
			
			//fov += event.detail * 1.0;
			
		}
		
	}
	
	function onDocumentKeyUp(event) {
	
	}
	
	function zoomIn(amount) {
	}
	
	function zoomOut(amount) {
	}
	
	function render() {
		
		
	}
	
	
	return PanoramaViever;
	
})(this, this.document);
