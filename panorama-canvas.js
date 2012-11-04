window.panorama = window.panorama || {};

window.panorama.utils = {
	log : function (text) {
		if (console) {
			console.log(text);
		}
	}
}

window.panorama.Controller = function(obj){
	obj.find('.control.photo').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.affichePhoto = !AffichePanorama.affichePhoto;
		AffichePanorama.render();
	});
	obj.find('.control.sommet').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.afficheSommet = !AffichePanorama.afficheSommet;
		AffichePanorama.render();
	});
	obj.find('.control.panorama').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.affichePanoramaLink = !AffichePanorama.affichePanoramaLink;
		AffichePanorama.render();
	});
	obj.find('.control.origin').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.goToOrigin();
		AffichePanorama.render();
	});
}

window.panorama.Tiles = function (img, i, largeur) {
	var self = this;
	this.img = img;
	this.i = i;
	this.xi = i * largeur;
	
	this.affiche = function(x, fov) {
		return self.xi >= x - largeur && self.xi <= x + 1024 * (1 / fov);
	}
}

window.Panorama = function (args) {
	var args = args || {};
	var self = this;
	
	this.id = args.id || 1;
	this.image = args.image || 'panorama.jpg';
	this.hauteur = args.hauteur || 768;
	this.largeur = args.largeur || 1024;
	this.origin = args.origin  || 0;
	if (args.loop !== undefined) {
		this.loop = args.loop;
	}
	this.nbImage = args.nbImage || 1;
	
	this.sommets = args.sommets || [];
	this.photos = args.photos || [];
	this.panoramas = args.panoramas || [];
}

window.PanoramaLink = function(x, y, id) {
	var self = this;

	this.x = x;
	this.y = y;
	this.w = 50;
	this.h = 50;
	
	this.id = id || 1;
	
	this.isSelected = function(x, y, fov) {
		//panorama.utils.log('isSelected' + x + ':' + y);
		return x >= self.x && x <= self.x + (self.w / fov) && y >= self.y && y <= self.y + (self.h / fov);
	}
}

window.Photo = function (imgUrl, x, y) {
	var self = this;
	
	this.imgUrl = imgUrl;
	this.x = x;
	this.y = y;
	this.w = 50;
	this.h = 50;
	this.loaded = false;
	this.isSelected = function(x, y, fov) {
		panorama.utils.log('isSelected' + x + ':' + y);
		return x >= self.x && x <= self.x + (self.w / fov) && y >= self.y && y <= self.y + (self.h / fov);
	}
	
	this.img = new Image();
	this.img.onload = function (obj) {
		self.loaded = true;
	};
	this.img.src = this.imgUrl;
}

window.Sommet = function (text, x, y) {
	var self = this;
	
	this.text = text || '';
	this.x = x || 0;
	this.y = y || 0;
	
	this.hauteurFleche = 50;
	this.fontSize = '26pt';
}

window.AffichePanorama = (function (window, document, undefined) {
	
	var AffichePanorama = {
		x : 0,
		y : 0,
		fovMax : 2, 
		tiles :[], useMoveTimeout : true,
	},
	bigImage,
	i = 0,
	ctx,
	loadImage,
	panoramaLinkImage,
	isUserInteracting = false,		
	onMouseDownMouseX = 0,
	onMouseDownMouseY = 0,
	onOldMouseDownMouseX = 0,
	onOldMouseDownMouseY = 0;
	
	AffichePanorama.searchPano = function(pano) {
		if ($.isNumeric(pano)) {
			for (i = 0; i < AffichePanorama.panoramas.length; i++) {
				var value = AffichePanorama.panoramas[i];			
				if (value.id == pano) {
					return value;
				}
			}
		}
		return null;
	}
	
	AffichePanorama.loadPano = function (pano) {
				
		var pano = AffichePanorama.searchPano(pano) || pano || {},
		baseImage = pano.image || 'panorama.jpg',
		nbImage = pano.nbImage || 1;
		
		AffichePanorama.hauteur = pano.hauteur || 768;
		AffichePanorama.largeur = pano.largeur || 1024;
		AffichePanorama.panorama = pano;
		AffichePanorama.useCssTransforms = false;
	
	    AffichePanorama.tiles = [];
		AffichePanorama.y = 0;
		AffichePanorama.goToOrigin();
		AffichePanorama.fov = AffichePanorama.fovMin = $(window).height() / AffichePanorama.hauteur;
		
		loadImage = new Image();
		loadImage.onload = function () {
			AffichePanorama.render();
		};
		loadImage.src = 'load_' + baseImage;
				
		panoramaLinkImage = new Image();
		panoramaLinkImage.onload = function () {
			AffichePanorama.render();
		};
		panoramaLinkImage.src = 'PanoramaIcon.png';
		
		if (nbImage == 1) {			
			var image = new Image();
			image.onload = function () {
				loadImage = null;
				bigImage = image;
				AffichePanorama.render();
			};
			image.src = baseImage;			
		} else {
			for (i = 0; i < nbImage; i++) {
				var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));
				var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
				
				var image = new Image();				
				image.onload = (function (xi) {
					AffichePanorama.tiles.push(new panorama.Tiles(image, xi, AffichePanorama.largeur / nbImage));
					AffichePanorama.render();
				})(i);
				image.src = imageName + '_' + (i + 1) + imageExtension;
			}
		}
		
	
	}
	
	AffichePanorama.init = function (args) {
		
		var args = args || {},
		containerSelector = args.containerSelector || '#canvas',
		canvas = $(containerSelector);
		
		AffichePanorama.panoramas = args.panos;
		AffichePanorama.afficheSommet = true;
		AffichePanorama.affichePhoto = false;
		AffichePanorama.affichePanoramaLink = true;
		AffichePanorama.canvas = canvas;
		
		ctx = canvas[0].getContext("2d");
		
		canvas.attr("height", $(window).height());
		canvas.attr("width", $(window).width());
		canvas.css('height', $(window).height() + 'px');
		canvas.css('width', $(window).width() + 'px');
				
		if (document.addEventListener) {
			document.addEventListener('mousewheel', onDocumentMouseWheel, false);
			document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
			document.addEventListener('keyup', onDocumentKeyUp, false);
		} else {
			document.onmousewheel = onDocumentMouseWheel;
		}
		$(document).mousemove(function (event) {
			onDocumentMouseMove(event)
		});
		$(document).mousedown(function (event) {
			onDocumentMouseDown(event)
		});
		$(document).mouseup(function (event) {
			onDocumentMouseUp(event)
		});
		$(window).resize(function() {
			window.panorama.utils.log('Resize');
			canvas.attr("height", $(window).height());
			canvas.attr("width", $(window).width());
			canvas.css('height', $(window).height() + 'px');
			canvas.css('width', $(window).width() + 'px');
			AffichePanorama.render();
		});
		
	}
	
	AffichePanorama.setX = function (deltaX) {
		AffichePanorama.x = AffichePanorama.x + deltaX;
		if (AffichePanorama.panorama.loop) {
			if (AffichePanorama.x > AffichePanorama.largeur) {
				AffichePanorama.x = 0;
			}
			if (AffichePanorama.x < -AffichePanorama.largeur) {
				AffichePanorama.x = 0;
			}
		}
		else {
			if (AffichePanorama.x >= 0) {
				AffichePanorama.x = 0;
			}
			var oo = AffichePanorama.largeur - window.innerWidth / AffichePanorama.fov;
			if (AffichePanorama.x <= -oo){
				AffichePanorama.x = -oo;
			}
		}
	}
	
	AffichePanorama.setY = function (deltaY) {
		AffichePanorama.y = AffichePanorama.y + deltaY;
		if (AffichePanorama.y > 0) {
			AffichePanorama.y = 0;
		}
		
		// Need to find a lower limit that take in account fov
		var oo = window.innerHeight - AffichePanorama.y;
		var oo2 = AffichePanorama.hauteur * AffichePanorama.fov - window.innerHeight;
		panorama.utils.log(oo + '    ' + oo2);
		if (oo > AffichePanorama.hauteur * AffichePanorama.fov) {
			AffichePanorama.y =  - (oo2);
		}
	}
	
	AffichePanorama.move = function (x, y) {
		AffichePanorama.setX(- (x || 1));	
		AffichePanorama.setY(- (y || 1));	
		AffichePanorama.render();		
	}
	
	AffichePanorama.moveRight = function (r) {
		AffichePanorama.setX(- (r || 1));	
		AffichePanorama.render();		
	}
		
	AffichePanorama.moveLeft = function (l) {
		AffichePanorama.setX( l || 1);
		AffichePanorama.render();		
	}
	
	AffichePanorama.goToOrigin = function () {
		AffichePanorama.x = -AffichePanorama.panorama.origin ;
	}
	
	AffichePanorama.setFov = function (deltaFov) {
		AffichePanorama.fov += deltaFov;
		if (AffichePanorama.fov < AffichePanorama.fovMin) {
			AffichePanorama.fov = AffichePanorama.fovMin;
			AffichePanorama.y = 0;
		}
		if (AffichePanorama.fov > AffichePanorama.fovMax) {
			AffichePanorama.fov = AffichePanorama.fovMax;
		}
	}
	
	function onDocumentMouseDown(event) {
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
		onOldMouseDownMouseX = onPointerDownPointerX;
		onOldMouseDownMouseY = onPointerDownPointerY;
		
		panorama.utils.log('[onDocumentMouseDown] onPointerDownPointerX : ' + onPointerDownPointerX + ' ,onPointerDownPointerY : ' + onPointerDownPointerY);
		
		if (AffichePanorama.affichePhoto) {
			for (i = 0; i < AffichePanorama.panorama.photos.length; i++) {
				var photo = AffichePanorama.panorama.photos[i];
				var isSelected = photo.isSelected( -AffichePanorama.x + onPointerDownPointerX / AffichePanorama.fov, -AffichePanorama.y + onPointerDownPointerY / AffichePanorama.fov, AffichePanorama.fov);			
				console.log('p->' + isSelected);
				if (isSelected) {
					$('#photoImg').attr('src' , photo.imgUrl);
					$('#photo').css('width', $(document).width()-100);
					$('#photo').css('height', $(document).height()-100);
					$('#photo').show();
					return ;
				}
			}
		}
		
		if (AffichePanorama.affichePanoramaLink) {
			for (i = 0; i < AffichePanorama.panorama.panoramas.length; i++) {
				var pano = AffichePanorama.panorama.panoramas[i];
				var isSelected = pano.isSelected( -AffichePanorama.x + onPointerDownPointerX / AffichePanorama.fov, -AffichePanorama.y + onPointerDownPointerY / AffichePanorama.fov, AffichePanorama.fov);			
				console.log('pano->' + isSelected);
				if (isSelected) {
					AffichePanorama.loadPano(pano.id);
					return ;
				}
			}
		}
	}
	
	function onDocumentMouseMove(event) {
		if (isUserInteracting) {
			if (AffichePanorama.useMoveTimeout) {
				clearInterval(AffichePanorama.moveTimeoutFtn);
				var x = event.clientX - onOldMouseDownMouseX;
				var y = event.clientY - onOldMouseDownMouseY;
				AffichePanorama.moveTimeoutFtn = setInterval(function() { AffichePanorama.move(x, y); }, 15);
				return ;
			}
			AffichePanorama.setX(event.clientX - onOldMouseDownMouseX);
			AffichePanorama.setY(event.clientY - onOldMouseDownMouseY);
			onOldMouseDownMouseX = event.clientX;
			onOldMouseDownMouseY = event.clientY;
			AffichePanorama.render();
		}
	}
	
	function onDocumentMouseUp(event) {
		isUserInteracting = false;
		if (AffichePanorama.useMoveTimeout) {
			clearInterval(AffichePanorama.moveTimeoutFtn);			
			return ;
		}
	}
	
	function onDocumentMouseWheel(event) {
		panorama.utils.log('mouse wheel');
		var event = event || window.event;
		// WebKit
		
		if (event.wheelDeltaY) {
			
			AffichePanorama.setFov(event.wheelDeltaY * 0.001);
			
			// Opera / Explorer 9
			
		} else if (event.wheelDelta) {
			
			AffichePanorama.setFov(event.wheelDelta * 0.005);
			
			// Firefox
			
		} else if (event.detail) {
			
			AffichePanorama.setFov(event.detail * 0.01);
			
		}
		AffichePanorama.render();
	}
	
	function onDocumentKeyUp(event) {}
	
	function zoomIn(amount) {
		panorama.utils.log('zoom In');
	}
	
	function zoomOut(amount) {}
	
	AffichePanorama.render = function() {
		window.panorama.utils.log('X = ' + AffichePanorama.x + ',Y = ' + AffichePanorama.y + ' , fov = ' + AffichePanorama.fov);
		if (AffichePanorama.useCssTransforms && Modernizr.csstransforms3d) {
			AffichePanorama.canvas.css('transform', 'scale3d('+AffichePanorama.fov+', '+AffichePanorama.fov+', 0)');
		}
		else if (AffichePanorama.useCssTransforms && Modernizr.csstransforms) {
			AffichePanorama.canvas.css('transform', 'scale('+AffichePanorama.fov+', '+AffichePanorama.fov+')');
		} else {
			ctx.setTransform(AffichePanorama.fov, 0, 0, AffichePanorama.fov, 0, 0);
		}
		ctx.translate(AffichePanorama.x, AffichePanorama.y);
		if (loadImage) {
			window.panorama.utils.log('Utilise Petite Image');
			ctx.drawImage(loadImage, 0, 0, AffichePanorama.largeur, AffichePanorama.hauteur);
			ctx.drawImage(loadImage, AffichePanorama.largeur, 0, AffichePanorama.largeur, AffichePanorama.hauteur);
			ctx.drawImage(loadImage, -AffichePanorama.largeur, 0, AffichePanorama.largeur, AffichePanorama.hauteur);
		} else {
			window.panorama.utils.log('Utilise Grande Image');
			ctx.drawImage(bigImage, 0, 0);
			ctx.drawImage(bigImage, AffichePanorama.largeur, 0);
			ctx.drawImage(bigImage, -AffichePanorama.largeur, 0);
		}
		if (AffichePanorama.tiles.length > 0) {
			window.panorama.utils.log('Utilise des Tuiles : ' + AffichePanorama.tiles.length);
			for (i = 0; i < AffichePanorama.tiles.length; i++) {
				if (AffichePanorama.tiles[i].affiche(-AffichePanorama.x, AffichePanorama.fov)) {
					window.panorama.utils.log('Affiche la tuile num:' + AffichePanorama.tiles[i].i);
					ctx.drawImage(AffichePanorama.tiles[i].img, AffichePanorama.tiles[i].xi, 0);
				}
			}
		}
		
		// Display sample of Text
		ctx.textAlign = "left";
		
		if (AffichePanorama.afficheSommet) {
			for (var i = 0; i < AffichePanorama.panorama.sommets.length; i++) {
				var sommet = AffichePanorama.panorama.sommets[i];
				ctx.font = 'normal ' + sommet.fontSize + ' sans-serif';
				
				ctx.save();
				ctx.translate(sommet.x, sommet.y - sommet.hauteurFleche);
				
				ctx.beginPath();
				ctx.moveTo(0, 5);
				ctx.lineTo(0, sommet.hauteurFleche);
				ctx.moveTo(5, sommet.hauteurFleche - 5);
				ctx.lineTo(0, sommet.hauteurFleche);
				ctx.lineTo( - 5, sommet.hauteurFleche - 5);
				ctx.lineWidth = 2;
				ctx.strokeStyle = "#000";
				ctx.stroke();
				
				ctx.rotate(-45);
				
				ctx.fillText(sommet.text, 0, 0);
				ctx.fillText(sommet.text, AffichePanorama.largeur, 0);
				ctx.fillText(sommet.text, -AffichePanorama.largeur, 0);
				ctx.restore();				
			}
		}
		
		if (AffichePanorama.affichePhoto) {
			for (var i = 0; i < AffichePanorama.panorama.photos.length; i++) {
				var photo = AffichePanorama.panorama.photos[i];
					if (photo.loaded) {
						ctx.save();
						ctx.translate(photo.x, photo.y);
						ctx.drawImage(photo.img, 0, 0, 100, 100);
					
						ctx.restore();		
					}				
			}
		}
		
		if (AffichePanorama.affichePanoramaLink) {
			for (var i = 0; i < AffichePanorama.panorama.panoramas.length; i++) {
				var panorama = AffichePanorama.panorama.panoramas[i];
						ctx.save();
						ctx.translate(panorama.x, panorama.y);
						ctx.drawImage(panoramaLinkImage, 0, 0, 50, 50);
					
						ctx.restore();		
									
			}
		}
		
		
	}
	
	return AffichePanorama;
	
})(this, this.document);


$(document).ready(function() {
	$('#photo').click(function() {
		$('#photo').hide();
	});
	new panorama.Controller($('.panorama.controller')) ;

});