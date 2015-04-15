var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    notify = require('gulp-notify'),
    livereload = require('gulp-livereload');

var env = 'development';


// SASS Task
gulp.task('sass', function () {
    var sassConfig = {
        errLogToConsole: true,
        includePaths: [
            'bower_components/foundation/scss/',
            'bower_components/fontawesome/scss/'
        ]
    };
    return gulp.src('scss/app.scss')
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'development', sass(sassConfig)))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulpif(env === 'production', sass(sassConfig)))
        .pipe(gulpif(env === 'production', minifycss()))
        .pipe(gulp.dest('css'))
        .pipe(notify({
            message: "Successfully compiled SASS"
        }))
        .pipe(livereload());
});

// JS Task
gulp.task('js', function () {
    return gulp.src([
        'bower_components/modernizr/modernizr.js',

        // Foundation components
        'bower_components/foundation/js/foundation.js',
        'bower_components/foundation/js/foundation/foundation.topbar.js',
        //'bower_components/foundation/js/foundation/foundation.equalizer.js',
        //'bower_components/foundation/js/foundation/foundation.accordion.js',
        //'bower_components/foundation/js/foundation/foundation.offcanvas.js',

        // jQuery Cycle
        //'bower_components/jquery.cycle2/index.js',

        // Custom javascript logic
        'src_js/app.js'
    ])
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'production', uglify()))
        .pipe(concat('app.js'))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulp.dest('js'))
        .pipe(notify({
            message: 'Successfully compiled JS'
        }))
        .pipe(livereload());
});

// Watch
gulp.task('watch', ['sass', 'js'], function () {
    livereload.listen();

    // Watch .scss files
    gulp.watch('scss/**/*.scss', ['sass']);

    // Watch .js files
    gulp.watch('src_js/**/*.js', ['js']);
});

// Default task
gulp.task('default', ['sass', 'js', 'watch'], function () {

});