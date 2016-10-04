'use strict';

/**
 * @function `gulp js`
 * @desc Use Webpack to transpile and bundle JavaScript sources. Add the `--webpack-watch` flag to use Webpack's built-in, faster file watcher while developing.
 */

var gulp = require('gulp'),
	util = require('gulp-util');

var taskName = 'js',
	taskConfig = {
		src: [
			'./source/assets/js/main.js',
			'./source/assets/js/head.js'
		],
		devSrc: [
			'./source/assets/js/dev.js'
		],
		srcBase: './source/assets/js/',
		dest: './build/assets/js/',
		destBase: './build/',
		destAsyncSuffix: 'async/',
		watch: util.env['webpack-watch'] ? null : [
			'source/assets/js/**/*.js',
			'source/assets/js/**/*.jsx',
			'source/assets/.tmp/**/*.js',
			'source/modules/**/*.js',
			'source/modules/**/*.jsx',
			'source/demo/modules/**/*.js',
			'source/demo/modules/**/*.jsx',
			'!source/modules/**/*.data.js',
			'!source/demo/modules/**/*.data.js',
			'!source/modules/**/*.mock.js',
			'!source/demo/modules/**/*.mock.js'
		]
	},
	task = function(config, cb) {
		var helpers = require('require-dir')('../../helpers'),
			_ = require('lodash'),
			path = require('path'),
			webpack = require('webpack'),
			livereload = require('gulp-livereload');

		var src = config.src,
			compiler;

		// Optionally build dev scripts
		if (util.env.dev) {
			src = src.concat(config.devSrc);
		}

		compiler = webpack({
			// Create a map of entries, i.e. {'assets/js/main': './source/assets/js/main.js'}
			entry: helpers.webpack.getEntries(src, config.srcBase),
			resolve: {
				alias: {

					// jquery: path.join(__dirname, '../../node_modules/jquery/dist/jquery.js')
				}
			},
			module: {
				loaders: [
					{
						test: /jquery\.js$/,
						loader: 'expose?jQuery'
					},
					{
						test: /(\.js|\.jsx)$/,
						exclude: /node_modules/,
						loader: 'babel-loader',
						query: {
							presets: ['es2015', 'react']

							// plugins: [
							// 	['transform-es2015-classes', {
							// 		loose: true
							// 	}]
							// ]
						}
					}
				]
			},

			// Minifiy in prod mode
			plugins: [

			].concat(util.env.dev ? [] : [
				new webpack.DefinePlugin({
					'process.env': {
						'NODE_ENV': JSON.stringify('production')
					}
				}),
				new webpack.optimize.UglifyJsPlugin({
					mangle: {
						'keep_fnames': true
					}
				})
			]),
			output: {
				path: config.dest,
				filename: util.env.dev ? '[name].js' : '[name].min.js',

				// Save async loaded files (using require.ensurce) in special dir
				chunkFilename: config.destAsyncSuffix + (util.env.dev ? '[name].js' : '[name].min.js'),

				// Tell webpack about the asset path structure in the browser to be able to load async files
				publicPath: path.join('/', path.relative(config.destBase, config.dest), '/')
			},
			devtool: util.env.dev ? 'eval-cheap-module-source-map' : null
		});

		if (util.env['webpack-watch']) {
			cb = _.once(cb);

			compiler.watch({

			}, function(err, stats) {
				helpers.webpack.log(err, stats, taskName);

				livereload.reload();

				cb();
			});
		} else {
			compiler.run(function(err, stats) {
				helpers.webpack.log(err, stats, taskName);

				livereload.reload();

				cb();
			});
		}
	};

gulp.task(taskName, ['js:lint'], function(cb) {
	return task(taskConfig, cb);
});

module.exports = {
	taskName: taskName,
	taskConfig: taskConfig,
	task: task
};
