/*global module*/
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        jshintrc: '.jshintrc'
      },
      beforeuglify: ['<%= pkg.name %>.js'],
      gruntfile: ['Gruntfile.js']
    },
    uglify: {
      build: {
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.min.js'
      },
      options: {
        mangle: true,
        compress: true,
        banner: 
          '/*! <%= pkg.name %>\n' + 
          'version: <%= pkg.version %>\n' +
          'build date: <%= grunt.template.today("yyyy-mm-dd") %>\n' + 
          'author: <%= pkg.author %>\n' + 
          '<%= pkg.repository.url %> */\n'
      }
    },
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= pkg.name %>.js',
        tasks: ['default']
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: '',
          keepalive: true
        }
      }
    },
    karma: {
      unit: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: false,
        singleRun: true
      },
      unit_auto: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: true,
        singleRun: false
      },
      unit_coverage: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: false,
        singleRun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'app/scripts/*.js': ['coverage']
        },
        coverageReporter: {
          type : 'html',
          dir : 'coverage/'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('test', ['test:unit']);
  grunt.registerTask('test:unit', ['karma:unit']);

  grunt.registerTask('autotest', ['karma:unit_auto']);
  grunt.registerTask('autotest:unit', ['karma:unit_auto']);

  grunt.registerTask('default', ['jshint:beforeuglify', 'uglify']);
};

