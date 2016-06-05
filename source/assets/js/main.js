import $ from 'jquery';
import events from './helpers/events.js';
import mediaqueries from './helpers/mediaqueries.js';
import skiplinks from '../../demo/modules/skiplinks/skiplinks.js';
import slideshow from '../../demo/modules/slideshow/slideshow.js';
import react from '../../demo/modules/react/react.jsx';

var modules = {
		skiplinks: skiplinks,
		slideshow: slideshow,
		react: react
	},
	initEvents = {};

// Create map of init events and corresponding modules
Object.keys(modules).forEach(function(module) {
	if (!modules[module].initEvents) {
		return;
	}

	modules[module].initEvents.forEach(function(initEvent) {
		if (!initEvents[initEvent]) {
			initEvents[initEvent] = [];
		}

		initEvents[initEvent].push(module);
	});
});

// Attach event listeners
Object.keys(initEvents).forEach(function(initEvent) {
	$(document).on(initEvent, function() {
		var initModules = initEvents[initEvent];

		$('[data-init]').each(function() {
			var $this = $(this),
				modules = $this.data('init').split(' ');

			modules.forEach(function(module) {
				if (initModules.indexOf(module) !== -1 && $.fn[module]) {
					$.fn[module].apply($this);
				}
			});
		});
	});
});

// Attach global events
events.mq = mediaqueries.event;

Object.keys(events).forEach(function(event) {
	events[event].attach();
});

// Save events to global namespace
$.extend(true, estatico, {
	events: events
});
