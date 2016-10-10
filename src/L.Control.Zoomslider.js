(function (factory) {
	// Packaging/modules magic dance
	var L;
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['leaflet'], factory);
	} else if (typeof module !== 'undefined') {
		// Node/CommonJS
		L = require('leaflet');
		module.exports = factory(L);
	} else {
		// Browser globals
		if (typeof window.L === 'undefined') {
			throw new Error('Leaflet must be loaded first');
        }
		factory(window.L);
	}
}(function (L) {
	'use strict';

	L.Control.Zoomslider = (function () {

		var Knob = L.Draggable.extend({
		initialize: function (element, stepHeight, knobHeight, reversed) {
			L.Draggable.prototype.initialize.call(this, element, element);
			this._element = element;

			this._stepHeight = stepHeight;
			this._knobHeight = knobHeight;

			this._reversed = reversed;

			this.on('predrag', function () {
				this._newPos.x = 0;
				this._newPos.y = this._adjust(this._newPos.y);
			}, this);
		},

		_adjust: function (y) {
			var value = Math.round(this._toValue(y));
			value = Math.max(0, Math.min(this._maxValue, value));
			return this._toY(value);
		},

		// y = k*v + m
		_toY: function (value) {
			if (this._reversed) {
				return this._m - (this._m - (this._k * value))
			} else {
				return this._k * value + this._m;
			}
		},
		// v = (y - m) / k
		_toValue: function (y) {
			if (this._reversed) {
				return (this._m - (this._m - y)) / this._k;
			} else {
				return (y - this._m) / this._k;
			}
		},

		setSteps: function (steps) {
			var sliderHeight = steps * this._stepHeight;
			this._maxValue = steps - 1;

			// conversion parameters
			// the conversion is just a common linear function.
            this._k = !this._reversed ? -this._stepHeight : this._stepHeight;
            this._m = sliderHeight - (this._stepHeight + this._knobHeight) / 2;
		},

		setPosition: function (y) { 
			L.DomUtil.setPosition(this._element,
								  L.point(0, this._adjust(y)));
		},

		setValue: function (v) {
			this.setPosition(this._toY(v));
		},

		getValue: function () {
			return this._toValue(L.DomUtil.getPosition(this._element).y);
		}
	});

	var Zoomslider = L.Control.extend({
		options: {
			position: 'topleft',
			// Height of the knob div in px (including border)
			knobHeight: 6,
			stepHeight: 6,
			styleNS: 'leaflet-control-zoomslider',
			reversed: false,
			zoomPresets: [

			]
		},

		onAdd: function (map) {
			this._map = map;
			this._ui = this._createUI();
			this._knob = new Knob(this._ui.knob,
								  this.options.stepHeight,
								  this.options.knobHeight,
								  this.options.reversed);

			//this._zoomPresets = this._initZoomPresets();

			map .whenReady(this._initKnob,           this)
				.whenReady(this._initEvents,         this)
				.whenReady(this._updateSize,         this)
				.whenReady(this._updateKnobValue,    this)
				.whenReady(this._updateDisabled,     this)
				.whenReady(this._initZoomPresets, 	 this);
			return this._ui.bar;
		},

		onRemove: function (map) {
			map .off('zoomlevelschange',         this._updateSize,      this)
				.off('zoomend zoomlevelschange', this._updateKnobValue, this)
				.off('zoomend zoomlevelschange', this._updateDisabled,  this);
		},

		_createUI: function () {
			var ui = {},
				ns = this.options.styleNS;

			ui.bar     = L.DomUtil.create('div', ns + ' leaflet-bar');

			if (!this.options.reversed) {
				ui.zoomIn  = this._createZoomBtn('in', 'top', ui.bar);
				ui.wrap    = L.DomUtil.create('div', ns + '-wrap leaflet-bar-part', ui.bar);
				ui.zoomOut = this._createZoomBtn('out', 'bottom', ui.bar);
			} else {
				ui.zoomOut = this._createZoomBtn('out', 'bottom', ui.bar);
				ui.wrap    = L.DomUtil.create('div', ns + '-wrap leaflet-bar-part', ui.bar);
				ui.zoomIn  = this._createZoomBtn('in', 'top', ui.bar);
			}

			ui.body    = L.DomUtil.create('div', ns + '-body', ui.wrap);
			ui.knob    = L.DomUtil.create('div', ns + '-knob');

			L.DomEvent.disableClickPropagation(ui.bar);
			L.DomEvent.disableClickPropagation(ui.knob);

			return ui;
		},
		_createZoomBtn: function (zoomDir, end, container) {
			var classDef = this.options.styleNS + '-' + zoomDir
					+ ' leaflet-bar-part'
					+ ' leaflet-bar-part-' + end,
				link = L.DomUtil.create('a', classDef, container);

			link.href = '#';

			L.DomEvent.on(link, 'click', L.DomEvent.preventDefault);

			return link;
		},

		_initKnob: function () {
			this._knob.enable();
			this._ui.body.appendChild(this._ui.knob);
		},
		_initEvents: function (map) {
			this._map
				.on('zoomlevelschange',         this._updateSize,      this)
				.on('zoomend zoomlevelschange', this._updateKnobValue, this)
				.on('zoomend zoomlevelschange', this._updateDisabled,  this);

			L.DomEvent.on(this._ui.body,    'click', this._onSliderClick, this);
			L.DomEvent.on(this._ui.zoomIn,  'click', this._zoomIn,        this);
			L.DomEvent.on(this._ui.zoomOut, 'click', this._zoomOut,       this);

			L.DomEvent.on(this._ui.bar,    'mouseenter', this._onMouseOver, this);
			L.DomEvent.on(this._ui.bar,    'mouseleave', this._onMouseLeave, this);

			this._knob.on('dragend', this._updateMapZoom, this);
		},
		
		_initZoomPresets: function () {
			var self = this,
				presets = this.options.zoomPresets,
				controlContainer = self._ui.bar,
				i, element, element_styles,
				outerElement = L.DomUtil.create('div', 'zoom-presets-wrapper', controlContainer);

			if (self.options.reversed) {
				outerElement.style.top = parseFloat(getComputedStyle(self._ui.zoomOut)['height']) + 'px';
				outerElement.style.bottom = parseFloat(getComputedStyle(self._ui.zoomIn)['height']) + 'px';
			} else {
				outerElement.style.top = parseFloat(getComputedStyle(self._ui.zoomIn)['height']) + 'px';
				outerElement.style.bottom = parseFloat(getComputedStyle(self._ui.zoomOut)['height']) + 'px';
			}
			
			outerElement.style.display = 'none';

			outerElement.show = function () {
				this.isVisible = true;
				this.style['display'] = 'block';
			};
			outerElement.show = outerElement.show.bind(outerElement);

			outerElement.hide = function () {
				this.isVisible = false;
				this.style['display'] = 'none';
			};
			outerElement.hide = outerElement.hide.bind(outerElement);

			for (i = 0; i < presets.length; i++) {
				element = L.DomUtil.create('div', 'zoom-preset-item', outerElement);
				element_styles = getComputedStyle(element)

				element.innerHTML = presets[i].label;
				element.style['top'] = this._knob._toY(presets[i].zoom) + 'px';
				// element.setAttribute('data-label', presets[i].label);
				element.addEventListener('click', self._zoomItemClick.bind(self, presets[i].zoom));
			}

			this._zoomPresets = outerElement;
			return outerElement;
		},

		_zoomItemClick: function (zoom) {
			var self = this;
			self._knob.setValue(zoom);
			this._updateMapZoom();
		},

		_onMouseOver: function (e) {
			var self = this;
			if (self._closeTimeout) {clearTimeout(self._closeTimeout)}
			!this._zoomPresets.isVisible ? this._zoomPresets.show() : false;
		},

		_onMouseLeave: function(e){
			var self = this;
			this._closeTimeout = setTimeout(function () {
				self._zoomPresets.hide();
				self._closeTimeout = undefined;
			}, 1500);
		},

		_onSliderClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
				y = L.DomEvent.getMousePosition(first, this._ui.body).y;

			this._knob.setPosition(y);
			this._updateMapZoom();
		},

		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},
		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_zoomLevels: function () {
			var zoomLevels = this._map.getMaxZoom() - this._map.getMinZoom() + 1;
			return zoomLevels < Infinity ? zoomLevels : 0;
		},
		_toZoomLevel: function (value) {
			return Math.round(value + this._map.getMinZoom());
		},
		_toValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},

		_updateSize: function () {
			var steps = this._zoomLevels();

			this._ui.body.style.height = this.options.stepHeight * steps + 'px';
			this._knob.setSteps(steps);
		},
		_updateMapZoom: function () {
			this._map.setZoom(this._toZoomLevel(this._knob.getValue()));
		},
		_updateKnobValue: function () {
			this._knob.setValue(this._toValue(this._map.getZoom()));
		},
		_updateDisabled: function () {
			var zoomLevel = this._map.getZoom(),
				className = this.options.styleNS + '-disabled';

			L.DomUtil.removeClass(this._ui.zoomIn,  className);
			L.DomUtil.removeClass(this._ui.zoomOut, className);

			if (zoomLevel === this._map.getMinZoom()) {
				L.DomUtil.addClass(this._ui.zoomOut, className);
			}
			if (zoomLevel === this._map.getMaxZoom()) {
				L.DomUtil.addClass(this._ui.zoomIn, className);
			}
		}
	});

	return Zoomslider;
	})();

	L.Map.addInitHook(function () {
		if (this.options.zoomsliderControl) {
			this.zoomsliderControl = new L.Control.Zoomslider((this.options.zoomsliderOptions || {}));
			this.addControl(this.zoomsliderControl);
		}
	});

	L.control.zoomslider = function (options) {
		return new L.Control.Zoomslider(options);
	};
}));
