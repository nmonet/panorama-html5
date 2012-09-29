window.panorama = window.panorama || {};

window.panorama.utils = {
	log : function(text) {
		if (console) {
			console.log(text);
		}
	}

}

window.Panorama = function (args) {
	var args = args || {} ;
	var self = this;
	
	this.image = args.image || 'panorama.jpg';
	this.hauteur = args.hauteur || 768;
	this.largeur = args.largeur || 1024;
	
	this.sommets = args.sommets || [];
}

window.SommetAnnotation = function (text, x, y) {	
	var self = this;
	
	this.text = text || '';
	this.x = x || 0;
	this.y = y || 0;
}


window.AffichePanorama = (function (window, document, undefined) {
	
	
	var AffichePanorama = { x : 0, y: 0}, images = [], i = 0, ctx,
		isUserInteracting = false, canvasX = 0,  canvasY = 0, fov = 1,
		onMouseDownMouseX = 0,
		onMouseDownMouseY = 0,
		onOldMouseDownMouseX = 0,
		onOldMouseDownMouseY = 0;
	
	AffichePanorama.init = function (pano, args) {
		
		var args = args || {},
		pano = pano || {},
		baseImage = pano.image || 'panorama.jpg',
		nbImage = args.nbImage || 6,
		containerSelector = args.containerSelector || '#canvas',
		canvas = $(containerSelector);
		
		AffichePanorama.hauteur = pano.hauteur || 768;
		AffichePanorama.largeur = pano.largeur || 1024;
		AffichePanorama.panorama = pano;
		AffichePanorama.afficheSommet = true;
				
		ctx = canvas[0].getContext("2d");
		
		canvas.attr("height", $(window).height());
		canvas.attr("width", $(window).width());
		canvas.css('height', $(window).height() + 'px');
		canvas.css('width', $(window).width() + 'px');
		
		fov = $(window).height() / AffichePanorama.hauteur;
		
		if (nbImage == 1) {
			var image = new Image();
			image.onload = function() {
				render();
			};
			image.src = baseImage;			
			images.push(image);
		} else {
		for (i = 0; i < nbImage; i++) {
			var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));
			var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
			
			var image = new Image();
			image.onload = function() {
				//ctx.drawImage(image, i * image.width, 0);
				render();
			};
			image.src = imageName + '_' + (i+1) + imageExtension;			
			images.push(image);
		}
		}
		
		if (document.addEventListener) {
		
		
		//document.addEventListener('mousedown', onDocumentMouseDown, false);
		//document.addEventListener('mousemove', onDocumentMouseMove, false);
		//document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('mousewheel', onDocumentMouseWheel, false);
		document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
		document.addEventListener('keyup', onDocumentKeyUp, false);
		} else {
			document.onmousewheel = onDocumentMouseWheel;
		}
		$(document).mousemove(function(event) { onDocumentMouseMove(event)});
		$(document).mousedown(function(event) { onDocumentMouseDown(event)});
		$(document).mouseup(function(event) { onDocumentMouseUp(event)});

	}
	
	AffichePanorama.setX = function(deltaX) {
		AffichePanorama.x = AffichePanorama.x + deltaX;
		if (AffichePanorama.x > AffichePanorama.largeur) {
			AffichePanorama.x = 0;
		}
		if (AffichePanorama.x < -AffichePanorama.largeur) {
			AffichePanorama.x = 0;
		}
	}
	
	AffichePanorama.setY = function(deltaY) {
		AffichePanorama.y = AffichePanorama.y + deltaY;
		if (AffichePanorama.y > 0) {
			AffichePanorama.y = 0;
		}
		
		// Need to find a lower limit that take in account fov
		var oo = window.innerHeight - AffichePanorama.y;
		var oo2 = AffichePanorama.hauteur * fov - window.innerHeight;
		panorama.utils.log(oo + '    ' +oo2);
		if (oo > AffichePanorama.hauteur * fov) {
			AffichePanorama.y = - (oo2);
		}		
	}
	
	function onDocumentMouseDown(event) {
		
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
		onOldMouseDownMouseX = onPointerDownPointerX;
		onOldMouseDownMouseY = onPointerDownPointerY;
		
		panorama.utils.log('[onDocumentMouseDown] onPointerDownPointerX : '+onPointerDownPointerX + ' ,onPointerDownPointerY' + onPointerDownPointerY);
	}
	
	function onDocumentMouseMove(event) {
		if (isUserInteracting) {
			AffichePanorama.setX(event.clientX - onOldMouseDownMouseX);
			AffichePanorama.setY(event.clientY - onOldMouseDownMouseY);
			onOldMouseDownMouseX = event.clientX;
			onOldMouseDownMouseY = event.clientY;
			render();
		}
	}
	
	function onDocumentMouseUp(event) {		
		isUserInteracting = false;
	}
	
	function onDocumentMouseWheel(event) {
		panorama.utils.log('mouse wheel');
		var event = event || window.event;
		// WebKit
		
		if (event.wheelDeltaY) {
			
			fov += event.wheelDeltaY * 0.001;
			
			// Opera / Explorer 9
			
		} else if (event.wheelDelta) {
			
			fov += event.wheelDelta * 0.005;
			
			// Firefox
			
		} else if (event.detail) {
			
			fov -= event.detail * 0.1;
			
		}
		render();
	}
	
	function onDocumentKeyUp(event) {
	
	}
	
	function zoomIn(amount) {
		panorama.utils.log('zoom In');
	}
	
	function zoomOut(amount) {
	}
	
	function render() {
		panorama.utils.log('X = '+AffichePanorama.x + 'Y = '+AffichePanorama.y + ' , fov = '+fov);
		ctx.setTransform(fov, 0, 0, fov, 0, 0);
		ctx.translate(AffichePanorama.x, AffichePanorama.y);
		ctx.drawImage(images[0], 0, 0);
		ctx.drawImage(images[0], AffichePanorama.largeur, 0);
		ctx.drawImage(images[0], -AffichePanorama.largeur, 0);
		/*ctx.drawImage(images[0], AffichePanorama.x, AffichePanorama.y);
		ctx.drawImage(images[0], AffichePanorama.x + AffichePanorama.largeur, AffichePanorama.y);
		ctx.drawImage(images[0], AffichePanorama.x - AffichePanorama.largeur, AffichePanorama.y);*/
		
		// Display sample of Text
		ctx.font = "normal 16pt sans-serif";
		ctx.textAlign = "center";
		
		if (AffichePanorama.afficheSommet) {
			for (var i=0;i<AffichePanorama.panorama.sommets.length;i++){ 
				var sommet = AffichePanorama.panorama.sommets[i];
				ctx.fillText(sommet.text, sommet.x, sommet.y);  
				ctx.fillText(sommet.text, AffichePanorama.largeur + sommet.x, sommet.y);  
				ctx.fillText(sommet.text, -AffichePanorama.largeur + sommet.x, sommet.y);   
				
				/*ctx.fillText(sommet.text, AffichePanorama.x + sommet.x, AffichePanorama.y + sommet.y);  
				ctx.fillText(sommet.text, AffichePanorama.x + AffichePanorama.largeur + sommet.x, AffichePanorama.y + sommet.y);  
				ctx.fillText(sommet.text, AffichePanorama.x - AffichePanorama.largeur + sommet.x, AffichePanorama.y + sommet.y);   */

			}
		}
		
        /*ctx.fillText("Mont-Blanc", AffichePanorama.x + 1800, AffichePanorama.y + 550);  
		ctx.fillText("Mont-Blanc", AffichePanorama.x + AffichePanorama.largeur + 1800, AffichePanorama.y + 550);  
		ctx.fillText("Mont-Blanc", AffichePanorama.x - AffichePanorama.largeur + 1800, AffichePanorama.y + 550);   
		
		ctx.fillText("Aiguille du Midi", AffichePanorama.x + 1020, AffichePanorama.y + 660); */
	}
	
	
	return AffichePanorama;
	
})(this, this.document);
