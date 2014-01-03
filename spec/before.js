/*exported createMap */

// put after Leaflet files as imagePath can't be detected in a PhantomJS env
L.Icon.Default.imagePath = '../examples/lib/Leaflet/dist/images';

function createMap(options) {
	return L.map(document.createElement('div'), options).setView([0, 0], 16);
}
