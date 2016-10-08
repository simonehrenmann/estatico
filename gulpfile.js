'use strict';

var validatenv = require('validate-node-version')();

// Check Node Version
if (!validatenv.satisfies) {
	console.error(validatenv.message);
	process.exit(1);
}

// Load tasks
require('require-dir')('./gulp', {
	recurse: true
});
