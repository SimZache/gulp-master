var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload; // 静态服务器热更新
var htmlmin = require('gulp-htmlmin');// 压缩html
var less = require('gulp-less');// 编译less
var concat = require('gulp-concat');// 合并js
var uglify = require('gulp-uglify');// 压缩Js
var babel = require('gulp-babel');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');// 修改版本号
var clean = require('gulp-clean');// 清除文件
var rename = require('gulp-rename');// 文件重命名
var minifyCss = require('gulp-minify-css');// 压缩css
var gulpUtil = require('gulp-util');
var browserify = require('gulp-browserify');
var md5 = require('gulp-md5-plus');
var zip = require('gulp-zip');
var pkg = require('./package.json')
var replace = require('gulp-replace');

console.log(process.env.NODE_ENV, 'serverURL;;;;;;;;;;;;;;;;;;;;;;;;;;;22')
gulp.task('default', function () {
  // 启动服务器
  browserSync.init({
    server: {
      baseDir: './src',
      index: 'index.html' // 指定默认打开的文件
    }
  });

  // 复制图片到dist目录
  gulp.src('src/imgs/*.png')
    .pipe(gulp.dest('dist/imgs'));

  gulp.watch(['src/css/**/*.css'], ['clean-css', 'watch-less', 'replace-css']);
  gulp.watch(['src/js/**/*.js'], ['clean-js', 'watch-js', 'replace-js']);
  gulp.watch(['src/*.html'], ['watch-html', 'replace-js']);
});

/**
   * 每次检测到文件更新，首先删除旧文件
   */
gulp.task('clean-css', function () {
  return gulp.src('dist/css/**/*.css', { read: false })
    .pipe(clean());
});
gulp.task('clean-js', function () {
  return gulp.src('dist/js/**/*.js', { read: false })
    .pipe(clean());
});

/**
 * 检测到js、css文件变化时，进行编译、转译、添加版本号等操作，并输出到指令目录，生成rev-manifest.json对照表，同时热更新页面
 */
gulp.task('watch-js', ['clean-js'], function () {

  // return gulp.src(['script/*.js','!script/global.js'])
  return gulp.src('src/js/**/*.js')
    .pipe(babel())// 编译
    // .pipe(browserify({ transform: ['babelify'] }))
    .pipe(uglify().on('error', gulpUtil.log))//压缩
    //.pipe(gulp.dest('script/'))
    .pipe(rev())// 添加后缀
    // .pipe(replace('$@@$', '生也有涯而知也无涯'))
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest({
      path: 'dist/rev/rev-manifest.json',
      merge: true
    }))
    .pipe(gulp.dest('./'))
    .pipe(reload({ stream: true }));
});

gulp.task('watch-less', ['clean-css'], function () {
  return gulp.src('src/css/**/*.*ss')
    // .pipe(concat('global.less'))//合并
    .pipe(less())
    .pipe(minifyCss())
    .pipe(gulp.dest('css/'))
    .pipe(rev())
    .pipe(gulp.dest('dist/css/'))
    .pipe(rev.manifest({
      path: 'dist/rev/rev-manifest.json',
      merge: true
    }))
    .pipe(gulp.dest('./'))
    .pipe(reload({ stream: true }));
});
gulp.task('watch-html', function () {
  var options = {
    // collapseWhitespace: true, //压缩HTML空格
    collapseBooleanAttributes: true, // 省略布尔属性的值
    removeComments: true, // 清除html注释
    removeEmptyAttributes: false, // 删除所有空格做属性的值
    removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
    minifyJS: false, // 压缩页面JS
    minifyCSS: false // 压缩页面CSS
  };
  return gulp.src('src/**/*.html')
    .pipe(htmlmin(options))
    .pipe(gulp.dest('dist/'))
    .pipe(reload({ stream: true }));
});

/**
 * 修改dist目录下html文件引用路径
 */
gulp.task('replace-js', ['watch-js'], function () {
  return gulp.src(['dist/rev/*.json', 'dist/*.html'])
    .pipe(revCollector({
      replaceReved: true,
      merge: true
    }))
    .pipe(gulp.dest('./dist'));
});
gulp.task('replace-css', ['watch-less'], function () {
  return gulp.src(['dist/rev/*.json', 'dist/*.html'])
    .pipe(revCollector({
      replaceReved: true,
      merge: true
    }))
    .pipe(gulp.dest('./dist'));
});

// gulp build
gulp.task('replace-all', ['watch-less', 'watch-js', 'watch-html'], function () {
  return gulp.src(['dist/rev/*.json', 'dist/*.html'])
    .pipe(revCollector({
      replaceReved: true,
      merge: true
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-imgs', function () {
  return gulp.src('src/imgs/**/*')
    .pipe(gulp.dest('./dist/imgs'));
});

gulp.task('replaceTxt', function () {
  gulp.src(['dist/js/utils*.js'])
    .pipe(replace('$@@$', '江南好风景旧曾谙'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('build', ['watch-less', 'watch-js', 'watch-html', 'replace-all', 'copy-imgs'])

gulp.task('clean-zip', function () {
  return gulp.src('prodZip/**', { read: false })
    .pipe(clean());
});
gulp.task('getZip', ['clean-zip'], function () {
  return gulp.src('./' + pkg.config.inputDir + '/**')
    .pipe(zip(`${pkg.config.zipName}.zip`))
    .pipe(md5(`${pkg.config.zipName}.zip`))
    .pipe(gulp.dest('./' + pkg.config.outDir));
});