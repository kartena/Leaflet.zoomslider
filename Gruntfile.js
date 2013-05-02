/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json')
  });

  // Test suite
  grunt.registerTask('test', function() {
    var karma = require('karma'),
        testConfig = { configFile: __dirname+'/spec/karma.conf.js' };

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

    function isArgv(optName) {
      return process.argv.indexOf(optName) !== -1;
    }
  });

  // Default task.
  grunt.registerTask('default', ['test']);
};
