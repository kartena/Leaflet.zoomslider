module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: [
				'Gruntfile.js',
				'src/L.Control.Zoomslider.js',
				'spec/**/*.js'
			],
			options: {
				jshintrc: '.jshintrc',
				ignores: [
					'spec/happen.js'
				]
			}
		},
		karma: {
			options: {
				files: [
					'node_modules/expect.js/expect.js',
					'spec/happen.js',
					'node_modules/leaflet/dist/leaflet-src.js',
					'src/L.Control.Zoomslider.js',
					'spec/before.js',
					'spec/suites/*.js'
				],
				singleRun: true,
				plugins: [
					'karma-mocha',
					'karma-chrome-launcher',
					'karma-firefox-launcher',
					'karma-phantomjs-launcher'
				],
				frameworks: ['mocha']

			},
			phantomjs: {
				browsers: ['PhantomJS']
			},
			firefox: {
				browsers: ['Firefox']
			},
			chrome : {
				browsers: ['Chrome']
			},
			all: {
				browsers: ['Chrome', 'Firefox', 'PhantomJS']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');

	// Default task.
	grunt.registerTask('default', ['jshint', 'karma:phantomjs']);
	grunt.registerTask('test', ['jshint', 'karma:all']);
};
