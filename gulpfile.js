const gulp = require('gulp');
const lazypipe = require('lazypipe');
const rename = require('gulp-rename');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify');

function webpackBuild(filename, libraryName) {
  const config = {
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
      filename: filename,
      library: libraryName,
      libraryTarget: 'umd'
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
      }),
      // Use browser version of visionmedia-debug
      new webpack.NormalModuleReplacementPlugin(
        /debug\/node/,
        'debug/browser'
      ),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.DedupePlugin()
    ]
  };

  if (libraryName !== 'Babel') {
    // This is a secondary package (eg. Babili), we should expect that Babel
    // was already loaded, rather than bundling it in here too.
    config.externals = {
      'babel-standalone': 'Babel',
    };
  }
  return webpackStream(config);
}

const minifyAndRename = lazypipe()
  .pipe(uglify)
  .pipe(rename, { extname: '.min.js' });

gulp.task('default', ['build']);
gulp.task('build', ['build-babel', 'build-babili']);

gulp.task('build-babel', () => {
  return gulp.src('src/index.js')
    .pipe(webpackBuild('babel.js', 'Babel'))
    .pipe(gulp.dest('.'))
    .pipe(minifyAndRename())
    .pipe(gulp.dest('.'));
});
gulp.task('build-babili', () => {
  return gulp.src('src/babili.js')
    .pipe(webpackBuild('babili.js', 'Babili'))
    .pipe(gulp.dest('packages/babili-standalone/'))
    .pipe(minifyAndRename())
    .pipe(gulp.dest('packages/babili-standalone/'));
});
