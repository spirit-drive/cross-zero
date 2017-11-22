var gulp           = require('gulp'),
    gutil          = require('gulp-util' ),
    sass           = require('gulp-sass'),
    browserSync    = require('browser-sync'),
    concat         = require('gulp-concat'),
    uglify         = require('gulp-uglify'),
    cssnano 	   = require('gulp-cssnano'),
    cleanCSS       = require('gulp-clean-css'),
    rename         = require('gulp-rename'),
    del            = require('del'),
    imagemin       = require('gulp-imagemin'),
    cache          = require('gulp-cache'),
    autoprefixer   = require('gulp-autoprefixer'),
    ftp            = require('vinyl-ftp'),
    notify         = require("gulp-notify"),
    rsync          = require('gulp-rsync'),
    pug            = require('gulp-pug'),
    data           = require('gulp-data'),
    stylus         = require('gulp-stylus');

// Пользовательские скрипты проекта

gulp.task('js', function() {
    return gulp.src([
        'app/libs/jquery/dist/jquery.min.js',
        'app/blocks/**/*.js', // Всегда в конце
    ])
        .pipe(concat('scripts.min.js'))
        // .pipe(uglify()) // Минимизировать весь js (на выбор)
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false,
        // tunnel: true,
        // tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
    });
});
gulp.task('css-libs',function () {
    return gulp.src('app/libs/**/*.css')
        .pipe(concat('libs.min.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('app/css'));
});
gulp.task('stylus',function () {
    return gulp.src([
        'app/stylus/**/*.styl',
        'app/blocks/**/*.styl'
    ])
        .pipe(concat('main.min.css'))
        .pipe(stylus())
        .pipe(autoprefixer(['last 15 versions']))
        .pipe(gulp.dest('app/css'));
});
gulp.task('sass', function() {
    return gulp.src(['app/sass/**/*.sass','app/blocks/header/*.sass'])
        .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(autoprefixer(['last 15 versions']))
        // .pipe(cleanCSS()) // Опционально, закомментировать при отладке
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
});
gulp.task('pug',function () {
    return gulp.src('app/pug/index.pug')
        .pipe(pug({pretty: true}))//{pretty: true} читаемость и каскадность кода
        .pipe(gulp.dest('app'));
});


gulp.task('watch', ['sass','pug', 'js','css-libs', 'browser-sync'], function() {
    // gulp.watch(['app/stylus/**/*.styl','app/blocks/**/*.styl'],['stylus']);
    gulp.watch(['app/sass/**/*.+(scss|sass)','app/blocks/**/*.+(scss|sass)'],['sass']);
    gulp.watch(['app/pug/**/*.+(pug|jade)','app/blocks/**/*.+(pug|jade)'],['pug']);
    gulp.watch(['app/libs/**/*.js','app/blocks/**/*.js'], ['js']);
    gulp.watch('libs/**/*.css', ['css-libs']);
    gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('imagemin', function() {
    return gulp.src(['app/img/**/*','!app/img/psd/*.*'])
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'imagemin', 'sass', 'js'], function() {

    var buildFiles = gulp.src([
        'app/*.html',
        'app/.htaccess',
    ]).pipe(gulp.dest('dist'));

    var buildCss = gulp.src([
        'app/css/*.css',
    ])  .pipe(cleanCSS())
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'));

    var buildJs = gulp.src([
        'app/js/scripts.min.js',
    ])
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));

    var buildFonts = gulp.src([
        'app/fonts/**/*',
    ]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function() {

    var conn = ftp.create({
        host:      'hostname.com',
        user:      'username',
        password:  'userpassword',
        parallel:  10,
        log: gutil.log
    });

    var globs = [
        'dist/**',
        'dist/.htaccess',
    ];
    return gulp.src(globs, {buffer: false})
        .pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('rsync', function() {
    return gulp.src('dist/**')
        .pipe(rsync({
            root: 'dist/',
            hostname: 'username@yousite.com',
            destination: 'yousite/public_html/',
            // include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        }));
});

gulp.task('removedist', function() { return del.sync('dist'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
