function isArgv(optName) {
	return process.argv.indexOf(optName) !== -1;
}

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
					'spec/happen.js',
					'spec/karma.conf.js'
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');

	// Test suite
	grunt.registerTask('test', function () {
		var karma = require('karma'),
			testConfig = { configFile: __dirname + '/spec/karma.conf.js' };

		this.async();
		testConfig.singleRun = true;
		testConfig.autoWatch = false;
		testConfig.browsers = ['PhantomJS'];
		if (isArgv('--chrome')) {
			testConfig.browsers.push('Chrome');
		}
		if (isArgv('--ff')) {
			testConfig.browsers.push('Firefox');
		}

		karma.server.start(testConfig);
	});


	// Default task.
	grunt.registerTask('default', ['jshint', 'test']);
};
