import '../.tmp/modernizr.js';
import estatico from './helpers/namespace.js';
import fontLoader from './helpers/fontloader.js';

// Set up global namespace
window.estatico = estatico;

// Init font loader
fontLoader.init();
