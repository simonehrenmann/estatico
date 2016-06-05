import bows from 'bows';
import a11y from './helpers/a11y.js';
import inspector from './helpers/inspector.js';

// Enable by default
// Remove these lines and run "localStorage.removeItem('debug');" to disable
if (window.localStorage && !localStorage.debug) {
	localStorage.debug = true;
}

// Use bows for happy, colourful logging (https://github.com/latentflip/bows)
estatico.helpers.log = bows;

// Keyboard triggered helpers
document.onkeydown = function(e) {
	e = e || window.event;

	if (e.keyCode === 77 && e.ctrlKey) { // ctrl+m
		inspector.run();
	} else if (e.keyCode === 65 && e.ctrlKey) { // ctrl+a
		a11y.run();
	}
};
