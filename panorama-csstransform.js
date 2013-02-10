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
		AffichePanorama.panoContainer.find('.photos').toggle();
		AffichePanorama.render();
	});
	obj.find('.control.sommet').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.panoContainer.find('.sommets').toggle();
	});
	obj.find('.control.panorama').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.panoContainer.find('.panoramaslink').toggle();
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
	
	var AffichePanorama = { useMoveTimeout : true };
	var isUserInteracting = false,		
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
		AffichePanorama.fov = AffichePanorama.fovMin = $(window).height() / AffichePanorama.hauteur;
		AffichePanorama.y = 0;
		AffichePanorama.goToOrigin();		
		
		AffichePanorama.panoContainer.html('');
		//AffichePanorama.panoContainer.append('<div class="sommets"></div><div class="photos"></div><div class="panoramaslink"></div><div class="images"></div>');
		
		if (AffichePanorama.panorama.loop) {
			AffichePanorama.panoContainer.append('<div class="panoleft"><div class="sommets layer"></div><div class="photos layer"></div><div class="panoramaslink layer"></div><div class="images layer"></div></div>');
			AffichePanorama.panoContainer.append('<div class="panomiddle"><div class="sommets layer"></div><div class="photos layer"></div><div class="panoramaslink layer"></div><div class="images layer"></div></div>');
			AffichePanorama.panoContainer.append('<div class="panoright"><div class="sommets layer"></div><div class="photos layer"></div><div class="panoramaslink layer"></div><div class="images layer"></div></div>');
			
			AffichePanorama.panoContainer.find('.panoleft').css('left', '-' + AffichePanorama.largeur + 'px');
			AffichePanorama.panoContainer.find('.panoright').css('left', AffichePanorama.largeur + 'px');
		}
		else 
		{
			AffichePanorama.panoContainer.append('<div class="sommets layer"></div><div class="photos layer"></div><div class="panoramaslink layer"></div><div class="images layer"></div>');
		}
		AffichePanorama.panoContainer.find('.layer').width(AffichePanorama.largeur);
		AffichePanorama.panoContainer.find('.layer').height(AffichePanorama.hauteur);
		AffichePanorama.panoContainer.find('.images').css('background-image', 'url("load_' + baseImage+'")').css('background-size', 'cover');
		
		if (nbImage == 1) {
			/*if (AffichePanorama.panorama.loop) {
				$('<div class="image"><img src="'+baseImage+'"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'))
					.css('left', '-' + AffichePanorama.largeur + 'px');
				$('<div class="image"><img src="'+baseImage+'"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'));
				$('<div class="image"><img src="'+baseImage+'"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'))
					.css('left', AffichePanorama.largeur + 'px');				
			}else {
				$('<div class="image"><img src="'+baseImage+'"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'));
			}*/			
			$('<div class="image"><img src="'+baseImage+'"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'));
		} else {
			for (i = 0; i < nbImage; i++) {
				var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));
				var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
				var imgSrc = imageName + '_' + (i + 1) + imageExtension;
				
				AffichePanorama.panoContainer.find('.images').append('<div class="image"><img src="'+imgSrc+'"/></div>');
			}
		}
		for (var i = 0; i < AffichePanorama.panorama.panoramas.length; i++) {
			var panorama = AffichePanorama.panorama.panoramas[i];
			
			$('<div class="panoramalink" data-panoid="'+panorama.id+'"></div>').appendTo(AffichePanorama.panoContainer.find('.panoramaslink'))
				.css('left', panorama.x + 'px').css('top', panorama.y + 'px');
		}
		for (var i = 0; i < AffichePanorama.panorama.sommets.length; i++) {
			var sommet = AffichePanorama.panorama.sommets[i];
			
			$('<div class="sommet"><div class="text">'+sommet.text+'</div><div class="icon arrow"></div></div>').appendTo(AffichePanorama.panoContainer.find('.sommets'))
				.css('left', sommet.x + 'px').css('top', (sommet.y - 50) + 'px');
			
		}
		for (var i = 0; i < AffichePanorama.panorama.photos.length; i++) {
			var photo = AffichePanorama.panorama.photos[i];
			
			$('<div class="photo" data-imgurl="'+photo.imgUrl+'"><img src="'+photo.imgUrl+'" width="100" height="100"></div>').appendTo(AffichePanorama.panoContainer.find('.photos'))
				.css('left', photo.x + 'px').css('top', photo.y + 'px');			
		}
		
		AffichePanorama.render();
	}
	
	AffichePanorama.init = function (args) {
		var args = args || {},
		containerSelector = args.containerSelector || '#pano';
		
		AffichePanorama.panoramas = args.panos;
		AffichePanorama.panoContainer = $(containerSelector);
			
		$(document).on('click', '.panoramalink', function(event) {
			AffichePanorama.loadPano($(this).data('panoid'));
		});		
		
		$(document).on('click', '.photos .photo', function(event) {
			$('#photoImg').attr('src' , $(this).data('imgurl'));
			$('#photo').css('width', $(window).width()-100);
			$('#photo').css('height', $(window).height()-100);
			$('#photo').show();
		});

		
		
		$(document).mousemove(function (event) {
			onDocumentMouseMove(event)
		});
		$(document).mousedown(function (event) {
			onDocumentMouseDown(event)
		});
		$(document).mouseup(function (event) {
			onDocumentMouseUp(event)
		});
		if (document.addEventListener) {
			document.addEventListener('mousewheel', onDocumentMouseWheel, false);
			document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
		} else {
			document.onmousewheel = onDocumentMouseWheel;
		}
	}
	
	AffichePanorama.setX = function (deltaX) {
		AffichePanorama.x = AffichePanorama.x + deltaX;
		if (AffichePanorama.panorama.loop) {
			if (AffichePanorama.x > AffichePanorama.largeur * AffichePanorama.fov) {
				AffichePanorama.x = 0;
			}
			if (AffichePanorama.x < -AffichePanorama.largeur * AffichePanorama.fov) {
				AffichePanorama.x = 0;
			}
		}
		else {
			if (AffichePanorama.x >= 0) {
				AffichePanorama.x = 0;
			}
			var oo = (AffichePanorama.largeur) * AffichePanorama.fov - window.innerWidth;
			if (AffichePanorama.x <= -oo){
				AffichePanorama.x = -oo;
			}
		}
		panorama.utils.log('AffichePanorama.x = ' + AffichePanorama.x);
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
	
	AffichePanorama.move = function (x, y) {
		AffichePanorama.setX(- (x || 1));	
		AffichePanorama.setY(- (y || 1));	
		AffichePanorama.render();	
	}
	
	AffichePanorama.goToOrigin = function () {
		AffichePanorama.x = -AffichePanorama.panorama.origin ;
		AffichePanorama.y = 0 ;
	}
	
	
	
	AffichePanorama.render = function () {
		AffichePanorama.panoContainer.transform( { 
			origin : ['0px', '0px'], 
			translate: [AffichePanorama.x + 'px', AffichePanorama.y + 'px'], 
			scale : [AffichePanorama.fov, AffichePanorama.fov]
		});
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
	
	function onDocumentMouseDown(event) {
		event.preventDefault();
		
		isUserInteracting = true;
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;
		onOldMouseDownMouseX = onPointerDownPointerX;
		onOldMouseDownMouseY = onPointerDownPointerY;
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
	
	return AffichePanorama;
	
})(this, this.document);


$(document).ready(function() {
	$('#photo').click(function() {
		$('#photo').hide();
	});
	new panorama.Controller($('.panorama.controller')) ;

});