/*global describe, it, beforeEach, expect, happen, createMap */
describe('Zooming behavior', function () {
	var map,
		tileLayer,
		ui;

	beforeEach(function () {
		map = createMap({ zoomAnimation: false, zoomsliderControl: true });
		tileLayer = L.tileLayer('{x},{y},{z}', { minZoom: 0, maxZoom: 19 }).addTo(map);
		ui = map.zoomsliderControl._ui;
	});

	describe('Buttons', function () {
		it('Should be able to zoom in', function () {
			map.setZoom(16);
			expect(map.getZoom()).to.eql(16);
			happen.click(ui.zoomIn);
			expect(map.getZoom()).to.eql(17);
		});

		it('Should be able to zoom out', function () {
			map.setZoom(16);
			expect(map.getZoom()).to.eql(16);
			happen.click(ui.zoomOut);
			expect(map.getZoom()).to.eql(15);
		});
	});

	describe('Knob', function () {
		var knob;

		beforeEach(function () {
			knob = map.zoomsliderControl._knob;
		});

		it('Should set max value to be map maxZoom - minZoom', function () {
			expect(knob._maxValue).to.eql(map.getMaxZoom() - map.getMinZoom());
		});

		it('Should match the map zoom level', function () {
			map.zoomIn();
			expect(map.getZoom()).to.eql(17);
			expect(knob.getValue()).to.eql(17);

			map.setZoom(2);
			expect(map.getZoom()).to.eql(2);
			expect(knob.getValue()).to.eql(2);
		});
	});
});
