'use strict';

/**
 * @function `gulp js:qunit`
 * @desc Run QUnit tests (using PhantomJS).
 */

var gulp = require('gulp'),
	util = require('gulp-util');

var taskName = 'js:qunit',
	taskConfig = {
		srcTests: [
			'./source/modules/**/*.test.js',
			'./source/pages/**/*.test.js',
			'./source/demo/modules/**/*.test.js',
			'./source/demo/pages/**/*.test.js'
		],
		srcBase: './source/',
		destTests: './build/test/',
		srcTemplates: [
			'./build/pages/**/*.html',
			'./build/demo/pages/**/*.html',
			'./build/modules/**/*.html',
			'./build/demo/modules/**/*.html'
		],
		srcTemplatesBase: './build/',
		srcQUnit: './source/preview/assets/js/test.js',
		destTemplates: './.qunit/',
		srcPolyfills: [
			'./node_modules/phantomjs-polyfill/bind-polyfill.js'
		],
		watch: util.env['webpack-watch'] ? null : [
			'source/modules/**/*.test.js',
			'source/pages/**/*.test.js',
			'source/demo/modules/**/*.test.js',
			'source/demo/pages/**/*.test.js'
		],
		viewports: {
			// tablet: { width: 700, height: 1000 },
			// mobile: { width: 400, height: 1000 },
			desktop: { width: 1400, height: 1000 }
		},
		phantomJS: ['--web-security=no']
	};

gulp.task(taskName, function(cb) {
	var helpers = require('require-dir')('../../helpers'),
		path = require('path'),
		_ = require('lodash'),
		tap = require('gulp-tap'),
		ignore = require('gulp-ignore'),
		webpack = require('webpack'),
		qunit = require('gulp-qunit'),
		del = require('del'),
		glob = require('glob'),
		lazypipe = require('lazypipe');

	var srcTests = [],
		ignoreFiles = [],
		polyfills = [],
		polyfillPathPrefix = path.relative(taskConfig.srcTemplatesBase, taskConfig.destTests),
		runQunit = lazypipe(),
		runTests = function(cb) {
			gulp.src(taskConfig.srcTemplates, {
				base: taskConfig.srcTemplatesBase
			})
				.pipe(tap(function(file) {
					var content = file.contents.toString(),
						relPathPrefix = path.relative(file.path, taskConfig.srcTemplatesBase),
						searchstring = taskConfig.srcQUnit;

					relPathPrefix = relPathPrefix
						.replace(new RegExp('\\' + path.sep, 'g'), '/') // Normalize path separator
						.replace(/\.\.$/, ''); // Remove trailing ..

					// Ignore files without a QUnit script reference
					searchstring = searchstring.replace(taskConfig.srcBase, '');
					if (content.search(searchstring) === -1) {
						ignoreFiles.push(file.path);

						return;
					}

					// Make paths relative to build directory, add base tag
					var regex = relPathPrefix.replace(new RegExp(/\./g), '\\.').replace(new RegExp(/\//g), '\\/');

					content = content
						.replace('<head>', '<head><base href="' + path.resolve(taskConfig.srcTemplatesBase) + path.sep + '">')
						.replace(new RegExp(regex, 'g'), '');

					// Re-enable autostart
					content = content.replace('</body>', '<script>QUnit.config.autostart = true;</script></body>');

					// Insert polyfills for PhantomJS
					polyfills.forEach(function(filePath) {
						filePath = path.join(polyfillPathPrefix, filePath);

						content = content.replace('<script', '<script src="' + filePath + '"></script><script');
					});

					file.contents = new Buffer(content);
				}))
				.pipe(ignore.exclude(function(file) {
					return _.indexOf(ignoreFiles, file.path) !== -1;
				}))

				// Move them outside /build/ for some weird phantomJS reason
				.pipe(gulp.dest(taskConfig.destTemplates))

				// Run tests in phantomJS
				.pipe(runQunit().on('error', helpers.errors))
				.on('end', function() {
					// Remove .qunit tmp folder
					del(taskConfig.destTemplates, cb);
				});
		},
		runs = 0,
		webpackConfig,
		compiler;

	if (_.size(taskConfig.viewports) === 0) {
		taskConfig.viewports = [null];
	}

	// Pipe through phantomJS for every viewport
	_.each(taskConfig.viewports, function(viewport) {
		runQunit = runQunit
			.pipe(tap, function() {
				if (viewport) {
					util.log('Testing viewport ' + JSON.stringify(viewport));
				} else {
					util.log('Testing default viewport');
				}
			})
			.pipe(qunit, {
				page: {
					viewportSize: viewport
				},
				'phantomjs-options': taskConfig.phantomJS
			});
	});

	// Resolve test paths
	taskConfig.srcTests.forEach(function(fileGlob) {
		srcTests = srcTests.concat(glob.sync(fileGlob));
	});

	// Add polyfills to files to be copied
	srcTests = srcTests.concat(taskConfig.srcPolyfills);

	// Resolve paths of polyfills
	taskConfig.srcPolyfills.forEach(function(fileGlob) {
		polyfills = polyfills.concat(glob.sync(fileGlob));
	});

	// Prepare config
	webpackConfig = [
		{
			// Create a map of entries, i.e. {'assets/js/main': './source/assets/js/main.js'}
			entry: helpers.webpack.getEntries([taskConfig.srcQUnit], taskConfig.srcBase),
			module: {
				loaders: [
					{
						test: /qunit\.js$/,
						loader: 'expose?QUnit'
					},
					{
						test: /\.css$/,
						loader: 'style-loader!css-loader'
					},
					{
						test: /(\.js|\.jsx)$/,
						exclude: /node_modules/,
						loader: 'babel-loader',
						query: {
							presets: ['es2015', 'react']
						}
					}
				]
			},
			externals: {
				'jquery': 'jQuery'
			},
			output: {
				path: taskConfig.destTests,
				filename: '[name].js'
			}
		},
		{
			// Create a map of entries, i.e. {'assets/js/main': './source/assets/js/main.js'}
			entry: helpers.webpack.getEntries(srcTests, taskConfig.srcBase, function(key) {
				// Move files from node_modules into target dir, too
				return key.replace(path.join('..', 'node_modules'), 'node_modules');
			}),

			module: {
				loaders: [
					{
						test: /(\.js|\.jsx)$/,
						exclude: /node_modules/,
						loader: 'babel-loader',
						query: {
							presets: ['es2015', 'react']
						}
					}
				]
			},
			externals: {
				'qunitjs': 'QUnit',
				'jquery': 'jQuery'
			},
			output: {
				path: taskConfig.destTests,
				filename: '[name].js'
			}
		}
	];

	// Init webpack
	compiler = webpack(webpackConfig);

	if (util.env['webpack-watch']) {
		cb = _.once(cb);

		compiler.watch({

		}, function(err, stats) {
			helpers.webpack.log(err, stats, taskName);

			// Run tests only if the build was not skipped and webpack is running for the first time (one run per config)
			if (util.env.skipBuild && runs < webpackConfig.length) {
				cb();

				runs++;
			} else {
				runTests(cb);
			}
		});
	} else {
		compiler.run(function(err, stats) {
			helpers.webpack.log(err, stats, taskName);

			runTests(cb);
		});
	}
});

module.exports = {
	taskName: taskName,
	taskConfig: taskConfig
};
