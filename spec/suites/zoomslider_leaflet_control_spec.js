/*global describe, it, expect, createMap */
describe('Control', function () {
	var map,
		tileLayer;

	it('Should add itself to the map unless zoomSliderControl is false', function () {
		map = createMap({ zoomAnimation: false, zoomsliderControl: true });
		expect(map.zoomsliderControl).to.be.an(L.Control.Zoomslider);
	});

	it('Should not add itself to the map if zoomSliderControl is set to false', function () {
		map = createMap({ zoomAnimation: false, zoomsliderControl: false });
		expect(map.zoomsliderControl).to.be(undefined);
	});

	it('The slider should move to the correct position when a layer is added', function () {
		map = createMap({ zoomAnimation: false, zoomsliderControl: true });
		tileLayer = L.tileLayer('{x},{y},{z}', { minZoom: 0, maxZoom: 19 }).addTo(map);
		expect(map.zoomsliderControl._knob.getValue()).to.eql(16);
	});
});
