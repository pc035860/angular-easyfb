module.exports = function(config) {
  config.set({
    files : [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',

      'angular-easyfb.js',

      'test/helper.js',
      'test/unit/*.js'
    ],
    basePath: '../',
    frameworks: ['jasmine'],
    reporters: ['progress'],
    browsers: [/*'Chrome', 'Firefox', */'PhantomJS'],
    autoWatch: false,
    singleRun: true,
    colors: true
  });
};
