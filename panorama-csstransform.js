window.panorama = window.panorama || {};

window.panorama.utils = {
	log : function (text) {
		if (console) {
			console.log(text);
		}
	}
}

window.panorama.Controller = function(obj){
	this.ctlPhotos = obj.find('.control.photo').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.panoContainer.find('.photo').toggle();
		AffichePanorama.render();
	});
	this.ctlSommets = obj.find('.control.sommet').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.panoContainer.find('.sommets').toggle();
	});
	this.ctlPanoramas = obj.find('.control.panorama').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.panoContainer.find('.panoslink').toggle();
	});
	this.ctlOrigin = obj.find('.control.origin').click(function(evt) {
		evt.stopPropagation();
		AffichePanorama.goToOrigin();
		AffichePanorama.render();
	});
	this.ctlGauche = obj.find('.control.gauche').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.move(-50, 0);
    });
	this.ctlDroite = obj.find('.control.droite').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.move(50, 0);
    });
	this.ctlHaut = obj.find('.control.haut').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.move(0, -50);
    });
	this.ctlBas = obj.find('.control.bas').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.move(0, 50);
    });
	this.ctlZoomMoins = obj.find('.control.zoommoins').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.setZoomLevel(-AffichePanorama.zoomDelta); 
    });
	this.ctlZoomPlus = obj.find('.control.zoomplus').click(function (evt) {
        evt.stopPropagation();
        AffichePanorama.setZoomLevel(AffichePanorama.zoomDelta); 
    });
	
	this.update = function(pano) {
		obj.find('.control').removeClass('disable');
		if (pano.photos.length == 0){
			obj.find('.control.photo').addClass('disable');
		}
		if (pano.sommets.length == 0){
			obj.find('.control.sommet').addClass('disable');
		}
		if (pano.panoramas.length == 0){
			obj.find('.control.panorama').addClass('disable');
		}
	}
}

window.Tiles = function(args) {
	this.x = args.x;
	this.y = args.y;
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
	this.nom = args.nom || '';
}

window.AffichePanorama = (function (window, document, undefined) {
	
	var AffichePanorama = { useMoveTimeout : true, zoomDelta : 0.5, miniX : 0, miniY : 0, x : 0, y :0 };
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
		baseImage = pano.image || 'panorama.jpg';
		
		document.title = "Panorama : " + pano.nom;
		AffichePanorama.nbImage = pano.nbImage || 1;
		AffichePanorama.hauteur = pano.hauteur || 768;
		AffichePanorama.largeur = pano.largeur || 1024;	
		AffichePanorama.ratio = pano.largeur / pano.hauteur;
		AffichePanorama.panorama = pano;
		AffichePanorama.fov = AffichePanorama.fovMin = $(window).height() / AffichePanorama.hauteur;
		AffichePanorama.zoomLevel = 1;
		AffichePanorama.y = 0;
		AffichePanorama.progress = 0;
		AffichePanorama.goToOrigin();
		
		AffichePanorama.panoContainer.html('');
		AffichePanorama.miniPanoContainer.html('');
		AffichePanorama.scalePanoContainer = $('<div class="scale"></div>').appendTo(AffichePanorama.panoContainer);
		
		var mainDivs = '<div class="infos layer"></div><div class="panoslink layer"></div><div class="sommets layer"></div><div class="images layer"></div>';
		if (AffichePanorama.panorama.loop) {
			AffichePanorama.scalePanoContainer.append('<div class="panoleft">' + mainDivs + '</div>');
			AffichePanorama.scalePanoContainer.append('<div class="panomiddle">' + mainDivs + '</div>');
			AffichePanorama.scalePanoContainer.append('<div class="panoright">' + mainDivs + '</div>');
			
			AffichePanorama.scalePanoContainer.find('.panoleft').css('left', '-' + AffichePanorama.largeur + 'px');
			AffichePanorama.scalePanoContainer.find('.panoright').css('left', AffichePanorama.largeur + 'px');
		}
		else 
		{
			AffichePanorama.scalePanoContainer.append(mainDivs);
		}

		var imageName = baseImage.substring(0, baseImage.lastIndexOf("."));

		AffichePanorama.panoContainer.find('.layer').width(AffichePanorama.largeur).height(AffichePanorama.hauteur);
		AffichePanorama.panoContainer.find('.images').css('background-image', 'url("Panoramas/'+imageName+'/load_' + baseImage+'")').css('background-size', 'cover');
		AffichePanorama.miniLargeur = AffichePanorama.ratio * 50;
		AffichePanorama.miniRatio = AffichePanorama.miniLargeur / (AffichePanorama.largeur * AffichePanorama.fov);
		AffichePanorama.miniPanoContainer
			.css('background-image', 'url("Panoramas/' + imageName + '/load_' + baseImage+'")')
			.css('background-size', 'cover')
			.css('width', AffichePanorama.miniLargeur + 'px')
			.append('<div class="zone">&nbsp;</div>');
		AffichePanorama.miniPanoContainerZone = $('#minipano').find('.zone');
		AffichePanorama.miniPanoZoneWidth = (AffichePanorama.miniLargeur * ($(window).width() / AffichePanorama.fov)) / AffichePanorama.largeur ;
		AffichePanorama.miniPanoContainerZone.css('height', 48 + 'px').css('width', AffichePanorama.miniPanoZoneWidth + 'px');
		
		if (AffichePanorama.nbImage == 1) {
			$('<div class="image"><img src="Panoramas/' + imageName + '/' + baseImage + '"/></div>').appendTo(AffichePanorama.panoContainer.find('.images'));
		} else {
			for (i = 0; i < AffichePanorama.nbImage; i++) {
				var imageExtension = baseImage.substring(baseImage.lastIndexOf("."));
				var imgSrc;
				if (i<9) {
                    imgSrc = 'Panoramas/' + imageName + '/' + imageName + '_0' + (i + 1) + imageExtension;
                } else {
                    imgSrc = 'Panoramas/' + imageName + '/' + imageName + '_' + (i + 1) + imageExtension;
                } 
				
				AffichePanorama.panoContainer.find('.images').append('<div class="image"><img src="' + imgSrc + '" onload="AffichePanorama.updateProgress()"/></div>');
			}
		}
		for (var i = 0; i < AffichePanorama.panorama.panoramas.length; i++) {
			var panorama = AffichePanorama.panorama.panoramas[i];
			
			$('<div class="info panoramalink ' + (panorama.cssClass || '') + '" title="' + (panorama.titre || '') + '" data-panoid="' + (panorama.id) + '"></div>').appendTo(AffichePanorama.panoContainer.find('.panoslink'))
				.css( {'left' : (panorama.x - AffichePanorama.panoDeltaX) + 'px', 'top': (panorama.y - AffichePanorama.panoDeltaY) + 'px'});			
		}
		for (var i = 0; i < AffichePanorama.panorama.sommets.length; i++) {
			var sommet = AffichePanorama.panorama.sommets[i];
			
			$('<div class="info sommet ' + (sommet.cssClass || '') + '"><div class="so"><div class="text">' + (sommet.text || '') + '</div><div class="icon arrow"></div></div></div>').appendTo(AffichePanorama.panoContainer.find('.sommets'))
				.css( {'left': sommet.x + 'px', 'top' : (sommet.y - 70) + 'px'});
		}
		for (var i = 0; i < AffichePanorama.panorama.photos.length; i++) {
			var photo = AffichePanorama.panorama.photos[i];
			
			$('<div class="info photo ' + (photo.cssClass || '') + '" data-imgurl="' + photo.imgUrl + '"><img src="' + photo.imgUrl + '" width="100" height="100"></div>').appendTo(AffichePanorama.panoContainer.find('.infos'))
				.css({'left' : photo.x + 'px', 'top': photo.y + 'px'});	
		}
		
		if (AffichePanorama.controller) {
			AffichePanorama.controller.update(AffichePanorama.panorama);
			AffichePanorama.controller.ctlHaut.addClass('disable');
			AffichePanorama.controller.ctlBas.addClass('disable');
			AffichePanorama.controller.ctlZoomMoins.addClass('disable');
		}
		AffichePanorama.refreshInfoScale();
		
		AffichePanorama.render();
	}
	
	AffichePanorama.init = function (args) {
		var args = args || {},
		containerSelector = args.containerSelector || '#pano';
		
		AffichePanorama.panoramas = args.panos;
		AffichePanorama.panoContainer = $(containerSelector);
		AffichePanorama.miniPanoContainer = $('#minipano');		
		AffichePanorama.controller = new panorama.Controller($('.panorama.controller')) ;
		AffichePanorama.panoDeltaX = args.panoDeltaX || 40;
		AffichePanorama.panoDeltaY = args.panoDeltaY || 40;
		AffichePanorama.infoScale = args.infoScale || 0.75;
		
		$(document).on('click', '.infos .photo', function(event) {
			$('#photoImg').attr('src' , $(this).data('imgurl'));
			$('#photo').css('width', $(window).width()-100);
			$('#photo').css('height', $(window).height()-100);
			$('#photo').show();
		});
		
		$(document).on('mousemove', '.panorama', function (event) {
			onDocumentMouseMove(event)
		});
		$(document).on('mousedown', '.panorama', function (event) {
			onDocumentMouseDown(event)
		});
		$(document).on('mouseup', '.panorama', function (event) {
			onDocumentMouseUp(event)
		});
		$(document).on('click', '.minipano', function(event) {
			// Calculate the coordinate of the pano according to the pageX. Remove left (10px) & zone width to center it
			var a = (event.pageX - 10 - AffichePanorama.miniPanoZoneWidth / 2) / AffichePanorama.miniRatio;
			AffichePanorama.x = -a;
			AffichePanorama.miniX = -AffichePanorama.x * AffichePanorama.miniRatio;
			checkMiniX();
		});
		$(document).keydown(function (event) {
			onDocumentKeyDown(event);
		});
		$(window).resize(function() {
			AffichePanorama.loadPano(AffichePanorama.panorama);
		});
		
		if (document.addEventListener) {
			document.addEventListener('mousewheel', onDocumentMouseWheel, false);
			document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
		} else {
			document.onmousewheel = onDocumentMouseWheel;
		}
		if (Modernizr.csstransforms) {
			(function animloop(){
				requestAnimFrame(animloop);
				AffichePanorama.render2d();
			})();		
		} else {
			(function animloop(){
				requestAnimFrame(animloop);
				AffichePanorama.render();
			})();
		}
	}
	
	AffichePanorama.updateProgress = function() {
		AffichePanorama.progress++;
		if (AffichePanorama.panorama.loop) {
			AffichePanorama.progressCent = AffichePanorama.progress * 100 / (AffichePanorama.nbImage * 4);			
		}
		else {
			AffichePanorama.progressCent = AffichePanorama.progress * 100 / (AffichePanorama.nbImage * 2);
		}
		if (AffichePanorama.progressFn && jQuery.isFunction(AffichePanorama.progressFn)) {
			AffichePanorama.progressFn(AffichePanorama.progressCent);
		}
	}
	
	AffichePanorama.setX = function (deltaX) {
		AffichePanorama.x = AffichePanorama.x + deltaX;		
		AffichePanorama.miniX = -AffichePanorama.x * AffichePanorama.miniRatio;
		checkMiniX();
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
				AffichePanorama.controller.ctlGauche.addClass('disable');
			} else {
				AffichePanorama.controller.ctlGauche.removeClass('disable');			
			}
			var oo = (AffichePanorama.largeur) * AffichePanorama.fov - window.innerWidth;
			if (AffichePanorama.x <= -oo){
				AffichePanorama.x = -oo;
				AffichePanorama.controller.ctlDroite.addClass('disable');
			} else {
				AffichePanorama.controller.ctlDroite.removeClass('disable');
			}
		}
		panorama.utils.log('AffichePanorama.x = ' + AffichePanorama.x);
	}
	
	AffichePanorama.setY = function (deltaY) {
		AffichePanorama.y = AffichePanorama.y + deltaY;		
		AffichePanorama.miniY = 0 ; //AffichePanorama.y * AffichePanorama.miniRatio;
		
		if (AffichePanorama.y >= 0) {
			AffichePanorama.y = 0;
			AffichePanorama.controller.ctlHaut.addClass('disable');
		} else {
			AffichePanorama.controller.ctlHaut.removeClass('disable');		
		}
		
		// Need to find a lower limit that take in account fov
		var oo = window.innerHeight - AffichePanorama.y;
		var oo2 = (AffichePanorama.hauteur * AffichePanorama.fovMin * AffichePanorama.zoomLevel) - window.innerHeight;
		panorama.utils.log(oo + '    ' + oo2);
		if (oo >= AffichePanorama.hauteur * AffichePanorama.fovMin * AffichePanorama.zoomLevel) {
			AffichePanorama.y =  - (oo2);
			AffichePanorama.controller.ctlBas.addClass('disable');
		} else {
			AffichePanorama.controller.ctlBas.removeClass('disable');
		}
	}
	
	AffichePanorama.setFov = function (deltaFov) {
		AffichePanorama.fov += deltaFov;
		AffichePanorama.controller.ctlZoomPlus.removeClass('disable');
		AffichePanorama.controller.ctlZoomMoins.removeClass('disable');
		if (AffichePanorama.fov < AffichePanorama.fovMin) {
			AffichePanorama.fov = AffichePanorama.fovMin;
			AffichePanorama.y = 0;
			AffichePanorama.controller.ctlZoomMoins.addClass('disable');
		}
		if (AffichePanorama.fov > AffichePanorama.fovMax) {
			AffichePanorama.fov = AffichePanorama.fovMax;
			AffichePanorama.controller.ctlZoomPlus.addClass('disable');
		}
	}
	
	AffichePanorama.setZoomLevel = function (delta, x, y) {
		var oldZoom = AffichePanorama.zoomLevel;
		AffichePanorama.zoomLevel = AffichePanorama.zoomLevel + delta; 
		if (AffichePanorama.zoomLevel <= 1) {
			AffichePanorama.zoomLevel = 1;
		}
		AffichePanorama.refreshInfoScale();
		if(!x) {
			x = $(window).width() / 2;
		}
		if (!y) {
			y = window.innerHeight / 2;
		}
		var oldX = parseInt((-AffichePanorama.x + x) / (AffichePanorama.fovMin * oldZoom));
		var oldY = parseInt((-AffichePanorama.y + y) / (AffichePanorama.fovMin * oldZoom));
		var afterX = parseInt((-AffichePanorama.x + x) / (AffichePanorama.fovMin * AffichePanorama.zoomLevel));
		var afterY = parseInt((-AffichePanorama.y + y) / (AffichePanorama.fovMin * AffichePanorama.zoomLevel));
		
		var aaY = (oldY - afterY) * (AffichePanorama.fovMin * AffichePanorama.zoomLevel);
	
		AffichePanorama.move((oldX - afterX)  * (AffichePanorama.fovMin * AffichePanorama.zoomLevel), (oldY - afterY) * (AffichePanorama.fovMin * AffichePanorama.zoomLevel) );
	}
	
	AffichePanorama.refreshInfoScale = function() {
		var infoScale = AffichePanorama.infoScale / (AffichePanorama.fovMin * AffichePanorama.zoomLevel);
		AffichePanorama.panoContainer.find('.info')
			.css('-webkit-transform', 'scale(' + infoScale + ',' + infoScale + ')')
			.css('transform', 'scale(' + infoScale + ',' + infoScale + ')');		
	}
	
	AffichePanorama.move = function (x, y) {
		AffichePanorama.setX(-x);
		AffichePanorama.setY(-y);
		//AffichePanorama.render();	
	}
	
	AffichePanorama.goToOrigin = function () {
		AffichePanorama.x = -(AffichePanorama.panorama.origin) * AffichePanorama.fov + $(window).width() / 2 ;
		if (AffichePanorama.x >= 0) {
				AffichePanorama.x = 0;
		}
		AffichePanorama.miniX = -AffichePanorama.x * AffichePanorama.miniRatio;
		AffichePanorama.y = 0 ;
	}
	
	
	
	AffichePanorama.render = function () {
		AffichePanorama.panoContainer.transform( { 
			origin : ['0px', '0px'], 
			translate: [AffichePanorama.x + 'px', AffichePanorama.y + 'px'], 
			scale : [AffichePanorama.fovMin * AffichePanorama.zoomLevel, AffichePanorama.fovMin * AffichePanorama.zoomLevel]
		});
		if (AffichePanorama.miniPanoContainerZone) {
			AffichePanorama.miniPanoContainerZone.transform( { 
				origin : ['0px', '0px'], 
				translate: [AffichePanorama.miniX + 'px', AffichePanorama.miniY + 'px'], 
			});
		}
	}
	
	AffichePanorama.render2d = function () {
		var scale = AffichePanorama.fovMin * AffichePanorama.zoomLevel,
			transform = 'translate(' + AffichePanorama.x + 'px,' + AffichePanorama.y + 'px) scale(' + scale + ',' + scale + ')';
		AffichePanorama.panoContainer
			.css('transform', transform)
			.css('-webkit-transform', transform)
			.css('-ms-transform', transform)
			.css('-moz-transform', transform)
			.css('-o-transform', transform);
		if (AffichePanorama.miniPanoContainerZone) {
			AffichePanorama.miniPanoContainerZone
				.css('transform', 'translate(' + AffichePanorama.miniX + 'px,' + AffichePanorama.miniY + 'px)')
				.css('-webkit-transform', 'translate(' + AffichePanorama.miniX + 'px,' + AffichePanorama.miniY + 'px)');
		}		
	}
	
	AffichePanorama.goFullScreen = function () {
		var elem = document.getElementById("pano");
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) {
		  elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
		  elem.webkitRequestFullscreen();
		}
	}
	
	function checkMiniX() {
		if (AffichePanorama.miniX < 0) {
			AffichePanorama.miniX = 0;
		}
		if (AffichePanorama.miniX + AffichePanorama.miniPanoZoneWidth + 2 > AffichePanorama.miniLargeur) {
			AffichePanorama.miniX = AffichePanorama.miniLargeur - AffichePanorama.miniPanoZoneWidth - 2;
		}
	}
		
	function onDocumentMouseWheel(event) {
		panorama.utils.log('mouse wheel');
		var event = event || window.event;
		// WebKit
		if (event.wheelDeltaY) {
			AffichePanorama.setFov(event.wheelDeltaY * 0.001);
			AffichePanorama.setZoomLevel(event.wheelDeltaY > 0 ? AffichePanorama.zoomDelta : -AffichePanorama.zoomDelta, event.pageX, event.pageY); 
			// Opera / Explorer 9			
		} else if (event.wheelDelta) {			
			AffichePanorama.setFov(event.wheelDelta * 0.005);			
			AffichePanorama.setZoomLevel(event.wheelDelta > 0 ? AffichePanorama.zoomDelta : -AffichePanorama.zoomDelta, event.pageX, event.pageY); 
			// Firefox			
		} else if (event.detail) {
			AffichePanorama.setFov(event.detail * 0.01);
			AffichePanorama.setZoomLevel(event.detail > 0 ? AffichePanorama.zoomDelta : -AffichePanorama.zoomDelta, event.pageX, event.pageY); 
		}
		//AffichePanorama.render();
	}
	
	
	function onDocumentKeyDown(event) {
		// Right Arrow
		if (event.which == 39) {
			AffichePanorama.move(5, 0);
		}
		else if (event.which == 37) {  // Left Arrow
			AffichePanorama.move(-5, 0);
		}
		else if (event.which == 38) {  // Up Arrow
			AffichePanorama.move(0, -5);
		}
		else if (event.which == 40) {  // Down Arrow
			AffichePanorama.move(0, 5);
		}
		else if (event.which == 70) {  // 'f' key
			AffichePanorama.goFullScreen();
		}
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

});

// shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();