/*
 * grunt-html-gettext
 * https://github.com/matskm/grunt-html-gettext
 *
 * Copyright (c) 2014 Mat Martin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    html_gettext: {
      msm_test:{
        files:{
          'locales/templates/LC_MESSAGES/msm_test.pot' : ['test/*.html']
          //'tmp/msm_test.out' : ['test/home.html']
        }
      },


      //default_options: {
      //  options: {
      //  },
      //  files: {
      //    '/default_options': ['test/fixtures/testing', 'test/fixtures/123']
      //  }
      //},
      //custom_options: {
      //  options: {
      //    separator: ': ',
      //    punctuation: ' !!!'
      //  },
      //  files: {
      //    'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']
      //  }
     ///}

    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  //grunt.registerTask('test', ['clean', 'html_gettext', 'nodeunit']);
  grunt.registerTask('test', ['clean', 'html_gettext']);

  // By default, lint and run all tests.
  //grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('default', ['test']);

  grunt.registerTask('hint',['jshint']);

};
