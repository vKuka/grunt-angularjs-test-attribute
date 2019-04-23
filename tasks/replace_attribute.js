/*
 * grunt-replace-attribute
 * https://github.com/vKuka/grunt-angularjs-test-attribute
 *
 * Copyright (c) 2015 will
 * Licensed under the MIT license.
 */

'use strict';

var async = require('async');

module.exports = function (grunt) {
  var Parser = require('./libs/parser');
  
  grunt.registerMultiTask('test_attribute', 'Replace the attribute of any html tag', function () {
    var options = this.options();
    var complete = this.async();
    
    if (!this.files) {
      return grunt.fail.warn('No files were specified');
    }
    
    async.eachSeries(this.files, function (file, done) {
      new Parser(grunt, options, file.src[0]).process(file, done);
    }, complete);
  });
};