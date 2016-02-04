var gulp = require('gulp');
var pkg = require('./package.json');
var plugins = require('gulp-load-plugins')();

var PATHS = {
  SRC: [
    'src/module.js',
    'src/APIResourceManager.js',
    'src/APIResource.js'
  ],
  DEST:'dist/'
};


/**
 * Create a new build.
 */
gulp.task('build', ['js']);


/**
 * Watch the files for changes.
 */
gulp.task('watch', ['js'], function() {
  gulp.watch(PATHS.SRC, ['js']);
});


/**
 * Generate the JS bundle, compress it and mangle it.
 */
gulp.task('js', function() {
  gulp
    .src(PATHS.SRC)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat(pkg.name + '.js'))
    .pipe(plugins.babel({
      presets: ['es2015'],
      plugins: ['transform-class-properties']
    }))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(PATHS.DEST));
});

