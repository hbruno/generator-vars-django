/* jshint -W069, -W079 */

/**
 *  <%= appname %><% if (appauthor !== '' || appauthoremail !== '') { %>
 *  (c)<% if (appauthor !== '') { %> <%= appauthor %><% } %><% if (appauthoremail !== '') { %> <<%= appauthoremail %>><% } %><% } %>
 *
 *  This software is released under the MIT License:
 *  http://www.opensource.org/licenses/mit-license.php
 */

'use strict';
// generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>

// Patterns.
var IMAGES_PATTERN = '{jpg,jpeg,gif,png,svg,ico}';
var SCRIPTS_PATTERN = 'js';
var STYLES_PATTERN = <% if (includeStylus) { %>'{css,styl}'<% } else if (includeSass) { %>'{css,scss}'<% } else { %>'css'<% } %>;
var TEMPLATES_PATTERN = '{html,shtml,htm,html.erb,asp,php}';
var EXTRAS_PATTERN = '{txt,htaccess}';
var FONTS_PATTERN = '{eot,svg,ttf,woff,woff2}';
var FILE_EXCLUDE_PATTERN = '{psd,ai}';

// Load modules.
var $ = require('gulp-load-plugins')();
var gulp = require('gulp');

/**
 * Compresses and deploys images to the temporary directory. Compression is skipped if --debug is specified.
 */
gulp.task('images', function()
{
    return gulp.src(['<%= paths.src %>/static/**/*'+IMAGES_PATTERN])
        .pipe($.if(!$.util.env['debug'] && !$.util.env['skip-imagemin'], $.imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{cleanupIDs: false}]
        })))
        .pipe(gulp.dest('<%= paths.tmp %>/static'));
});

/**
 * Deploys all fonts from Bower components if applicable.
 */
gulp.task('fonts', function()
{
    return gulp.src(require('main-bower-files')({ filter: '**/*.'+FONTS_PATTERN }).concat('<%= paths.src %>/static/fonts/**/*'))
        .pipe(gulp.dest('<%= paths.tmp %>/static/fonts'));
});

/**
 * Processes all CSS files if preprocessed CSS languages are used (i.e. Stylus, Sass). Copies the processed
 * files to a temporary directory to be iterated on in subsequent tasks. If --debug is specified, minification
 * will be skipped.
 */
gulp.task('styles', function()
{
    return gulp.src('<%= paths.src %>/static/**/*.'+STYLES_PATTERN)
        .pipe($.sourcemaps.init())<% if (includeStylus) { %>
        .pipe($.stylus({
            'include css': true
        }).on('error', $.util.log))<% } else if (includeSass) { %>
        .pipe($.sass({
            outputStyle: 'nested',
            precision: 10,
            includePaths: ['.'],
            onError: console.error.bind(console, 'Sass error:')
        }))<% } %>
        .pipe($.postcss([require('autoprefixer-core')({ browsers: ['last 2 version', 'ie 9'] })]))
        .pipe($.sourcemaps.write())
        .pipe($.if(!$.util.env['debug'] && !$.util.env['skip-csso'], $.csso()))
        .pipe(gulp.dest('<%= paths.tmp %>/static'));
});

/**
 * Processes and lints all JavaScript files. If Browserify is included this task will bundle up all associated files. Processed
 * JavaScript files are copied to a temporary directory to be iterated on in subsequent tasks. If --debug is specified, uglification
 * will be skipped.
 */
gulp.task('scripts', function()
{
    var browserify = require('browserify');
    var transform = require('vinyl-transform');
    var browserified = transform(function(filename)
    {
        var b = browserify(filename);
        return b.bundle();
    });

    return gulp.src(['<%= paths.src %>/static/**/*.'+SCRIPTS_PATTERN])
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.jshint.reporter('fail'))
        .pipe(browserified)
        .pipe($.if(!$.util.env['debug'] && !$.util.env['skip-uglify'], $.uglify()))
        .pipe(gulp.dest('<%= paths.tmp %>/static'));
});

/**
 * Processes vendor JavaScript files and deploys them to a temporary directory to be iterated on in subsequent tasks.
 */
gulp.task('vendors', function()
{
    return gulp.src(require('main-bower-files')({ filter: '**/*.'+SCRIPTS_PATTERN }))
        .pipe($.if(!$.util.env['debug'] && !$.util.env['skip-uglify'], $.uglify()))
        .pipe(gulp.dest('<%= paths.tmp %>/static/js/vendors'));
});

/**
 * Deploys any other required file types to the temporary directory to be iterated on in subsequent tasks.
 */
gulp.task('extras', function()
{
    return gulp.src(['<%= paths.src %>/static/**/*.'+EXTRAS_PATTERN], { dot: true })
        .pipe(gulp.dest('<%= paths.tmp %>/static'));
});

/**
 * Processes all static files (i.e. images, fonts, stylesheets, scripts, etc) and deploys them to the build
 * directory.
 */
gulp.task('static', ['images', 'fonts', 'styles', 'vendors', 'scripts', 'extras'], function()
{
    return gulp.src(['<%= paths.tmp %>/static/**/*'])
        .pipe(gulp.dest('<%= paths.build %>/static'));
});

/**
 * Processes all template files (i.e. HTML, etc) and deploys them to the temporary directory.
 */
gulp.task('templates', function()
{
    return gulp.src(['<%= paths.src %>/templates/**/*.'+TEMPLATES_PATTERN, '<%= paths.src %>/templates/robots.txt'])
        .pipe($.if(!$.util.env['debug'] && !$.util.env['skip-minify-html'], $.minifyHtml({empty: true, conditionals: true, loose: true })))
        .pipe(gulp.dest('<%= paths.build %>/templates'));
});

/**
 * Cleans the build directory.
 */
gulp.task('clean', require('del').bind(null, ['<%= paths.tmp %>', '<%= paths.build %>']));

/**
 * Builds the project including static files and templates and deploys the
 * entire project to the build directory. Note that in production environment
 * 'collectstatic' must be invoked in manage.py to complete deployment.
 */
gulp.task('build', ['static', 'templates'], function()
{
    return gulp.src(['<%= paths.src %>/**/*', '!<%= paths.src %>/{static,templates}/**/*'])
        .pipe(gulp.dest('<%= paths.build %>'));
});

/**
 * Watch files for changes.
 */
gulp.task('watch', ['styles'], function ()
{
    var debug = $.util.env['debug'];
    var baseDir = (debug) ? '<%= paths.tmp %>' : '<%= paths.build %>';

    // Watch for changes.
    if (debug)
    {
        gulp.watch('<%= paths.src %>/**/*.'+IMAGES_PATTERN, ['images']);
        gulp.watch('<%= paths.src %>/**/*.'+STYLES_PATTERN, ['styles']);
        gulp.watch('<%= paths.src %>/**/*.'+SCRIPTS_PATTERN, ['scripts']);
        gulp.watch('<%= paths.src %>/**/*.'+FONTS_PATTERN, ['fonts']);
        gulp.watch('<%= paths.src %>/**/*.'+TEMPLATES_PATTERN, ['templates']);
        gulp.watch('bower.json', ['fonts']);
    }
    else
    {
        gulp.watch('<%= paths.src %>/**/*.'+IMAGES_PATTERN, ['build']);
        gulp.watch('<%= paths.src %>/**/*.'+STYLES_PATTERN, ['build']);
        gulp.watch('<%= paths.src %>/**/*.'+SCRIPTS_PATTERN, ['build']);
        gulp.watch('<%= paths.src %>/**/*.'+FONTS_PATTERN, ['build']);
        gulp.watch('<%= paths.src %>/**/*.'+TEMPLATES_PATTERN, ['build']);
        gulp.watch('bower.json', ['build']);
    }
});

/**
 * Default task.
 */
gulp.task('default', ['clean'], function()
{
    gulp.start('build');
});