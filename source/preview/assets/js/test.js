/**
 * Handles the QUnit-functionality for estatico.
 *
 */

import $ from 'jquery';
import QUnit from 'qunitjs';
import 'qunitjs/qunit/qunit.css';

QUnit.config.autostart = false;

$(document).on('ready', function() {
	var $container = $('#qunit'),
		$button = $('<button>Run QUnit tests</button>'),
		startTests = function() {
			$container.show();
			$button.remove();

			QUnit.start();
		};

	if ($.isEmptyObject(QUnit.urlParams)) {
		$container.hide();

		$button
			.insertAfter($container)
			.on('click', function() {
				startTests();
			});
	} else {
		startTests();
	}
});
