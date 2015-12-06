var gulp = require('gulp');
var rename = require('gulp-rename');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
var uglify = require('gulp-uglify');

gulp.task('default', ['build']);
gulp.task('build', function() {
  return gulp.src('src/index.js')
    .pipe(webpackStream({
      module: {
        loaders: [
          {
            exclude: /node_modules/,
            test: /\.js$/,
            loader: 'babel',
            query: {
              presets: ['es2015', 'stage-0']
            }
          },
          {
            test: /\.json$/,
            loader: 'json'
          }
        ]
      },
      node: {
        // Mock Node.js modules that Babel require()s but that we don't
        // particularly care about.
        fs: 'empty',
        module: 'empty',
        net: 'empty'
      },
      output: {
        filename: 'babel.js',
        library: 'Babel',
        libraryTarget: 'umd',
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"'
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin()
      ]
    }))
    // Output unminified version
    .pipe(gulp.dest('.'))

    // Output minified version
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('.'));
});
