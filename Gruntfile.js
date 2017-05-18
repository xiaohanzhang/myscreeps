var config = require('./config.private');
var webpack = require('webpack');
      
module.exports = function(grunt) {
  grunt.initConfig({
    webpack: {
      options: require('./webpack.config'),
      dev: {
        watch: true,
        cache: true,
        keepalive: true,
      },
      prod: {
        plugins: [
          new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
          }),
          new webpack.optimize.UglifyJsPlugin({
            beautify: false,
            sourceMap: false,
            mangle: {
              screw_ie8: true,
              keep_fnames: true,
            },
            comments: false,
          }),
        ],
      },
    },
    screeps: {
      options: config.screeps,
      dist: {
        src: ['dist/bundle.js', 'dist/main.js'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-screeps');

  grunt.registerTask('default', ['webpack:dev']);
  grunt.registerTask('deploy', ['webpack:prod', 'screeps']);
};
