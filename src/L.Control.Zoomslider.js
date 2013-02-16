L.Control.Zoomslider = (function(){

	// TODO: remove some cpu cycles
	var Knob = L.Draggable.extend({
		initialize: function (element, steps, stepHeight) {
			L.Draggable.prototype.initialize.call(this, element, element);

			this._element = element;
			this._maxValue = steps - 1;
			this._initConversion(steps, stepHeight);

			this.on('predrag', function() {
				this._newPos.x = 0;
				this._newPos.y = this._adjust(this._newPos.y);
			}, this);
		},
		_initConversion: function (steps, stepHeight) {
			var sliderHeight = steps * stepHeight,
				knobHeight = 5 ; // this._element.offsetHeight; // TODO: Not inited yet. fix
			this._knobOffset = (stepHeight + knobHeight) / 2;
			this._k = -stepHeight;
			this._m = sliderHeight - this._knobOffset;
		},
		_adjust: function (y) {
			var value = Math.round(this._yToValue(y));
			value = Math.max(0, Math.min(this._maxValue, value));
			return this._valueToY(value);
		},
		// y = k*v + m
		_yToValue: function (y){
			return (y - this._m) / this._k;
		},
		// v = (y - m) / k
		_valueToY: function(v){
			return this._k * v + this._m;
		},

		setPosition: function(y){
			L.DomUtil.setPosition(this._element,
								  L.point(0, this._adjust(y)));
		},

		setValue: function (v) {
			var y = this._valueToY(v);
			L.DomUtil.setPosition(this._element, L.point(0, y));
		},

		getValue: function () {
			var y = L.DomUtil.getPosition(this._element).y;
			return this._yToValue(y);
		}
	});

	var Slider = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			stepHeight: 9,
			styleNS: "leaflet-control-zoomslider-slider"
		},

		initialize: function (element, steps, value) {
			this._steps = steps;
			this._height = this.options.stepHeight * steps;

			this._body = L.DomUtil.create('div',
										  this.options.styleNS + '-body',
										  element);
			this._body.style.height = this._height + "px";
			L.DomEvent.on(this._body, 'click', this._onClick, this);
			this._knob = this._createKnob(this._body);
			this._knob.enable();

			this.setValue(value);
		},

		setValue: function (value) {
			this._knob.setValue(value);
		},
		getValue: function() {
			return this._knob.getValue();
		},
		getSteps: function(){
			return this._steps;
		},

		_createKnob: function (parent) {
			var elem = L.DomUtil.create('div', this.options.styleNS + '-knob', parent);
			L.DomEvent.disableClickPropagation(elem);

			return new Knob(elem, this._steps, this.options.stepHeight)
				.on('dragend', function () {
					this.fire("update", { value: this._knob.getValue() } );
				}, this);
		},

		_onClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var y = L.DomEvent.getMousePosition(first).y
					- L.DomUtil.getViewportOffset(this._body).y; // Cache this?

			this._knob.setPosition(y);
			this.fire("update", { value: this._knob.getValue() } );
		}
	});

	var Zoomslider = L.Control.extend({
		options: {
			position: 'topleft',
			// height in px of zoom-slider.png
			stepHeight: 9,
			styleNS: 'leaflet-control-zoomslider'
		},

		onAdd: function (map) {
			var container = L.DomUtil.create('div', this.options.styleNS + ' leaflet-bar');

			L.DomEvent.disableClickPropagation(container);

			this._map = map;

			this._zoomInButton = this._createZoomButton(
				'in', 'top', container, this._zoomIn);

			this._sliderElem = L.DomUtil.create(
				'div',
				this.options.styleNS + "-slider leaflet-bar-part",
				container);

			this._zoomOutButton = this._createZoomButton(
				'out', 'bottom', container, this._zoomOut);

			map .on('layeradd layerremove', this._refresh, this)
				.on("zoomend", this._updateSlider, this)
				.on("zoomend", this._updateDisabled, this)
				.whenReady(this._createSlider, this)
				//.whenReady(this._updateSlider, this)
				.whenReady(this._updateDisabled, this);

			return container;
		},

		onRemove: function (map) {
			map .off("zoomend", this._updateSlider)
				.off("zoomend", this._updateDisabled)
				.off('layeradd layerremove', this._refresh);
		},

		_refresh: function () {
			// TODO: just refresh the slider
			if(!this._slider || this._slider.getSteps() !== this._zoomLevels() ){
				this._map
					.removeControl(this)
					.addControl(this);
			}
		},
		_zoomLevels: function(){
			return this._map.getMaxZoom() - this._map.getMinZoom() + 1;
		},

		_createSlider: function () {
			var zoomLevels = this._zoomLevels();
			// This means we have no tilelayers (or that they are setup in a strange way).
			// Either way we don't want to add a slider here.
			if(zoomLevels == Infinity){
				return;
			}
			this._slider = new Slider(
				this._sliderElem,
				zoomLevels,
				this._toSliderValue(this._map.getZoom())
			).on("update", this._updateZoom, this);
		},

		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},
		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_createZoomButton: function (zoomDir, end, container, fn) {
			var barPart = 'leaflet-bar-part',
				classDef = this.options.styleNS + '-' + zoomDir
					+ ' ' + barPart
					+ ' ' + barPart + '-' + end,
				title = 'Zoom ' + zoomDir,
				link = L.DomUtil.create('a', classDef, container);
			link.href = '#';
			link.title = title;

			L.DomEvent
				.on(link, 'click', L.DomEvent.preventDefault)
				.on(link, 'click', fn, this);

			return link;
		},
		_toZoomLevel: function (sliderValue) {
			return sliderValue + this._map.getMinZoom();
		},
		_toSliderValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},
		_updateZoom: function(e){
			this._map.setZoom(this._toZoomLevel(e.value));
		},
		_updateSlider: function(){
			if(this._slider){
				this._slider.setValue(this._toSliderValue(this._map.getZoom()));
			}
		},
		_updateDisabled: function () {
			var map = this._map,
				className = this.options.styleNS + '-disabled';

			L.DomUtil.removeClass(this._zoomInButton, className);
			L.DomUtil.removeClass(this._zoomOutButton, className);

			if (map.getZoom() === map.getMinZoom()) {
				L.DomUtil.addClass(this._zoomOutButton, className);
			}
			if (map.getZoom() === map.getMaxZoom()) {
				L.DomUtil.addClass(this._zoomInButton, className);
			}
		}
	});
	return Zoomslider;
})();

L.Map.mergeOptions({
    zoomControl: false,
    zoomsliderControl: true
});

L.Map.addInitHook(function () {
    if (this.options.zoomsliderControl) {
		L.control.zoomslider().addTo(this);
	}
});

L.control.zoomslider = function (options) {
    return new L.Control.Zoomslider(options);
};
