const gulp = require('gulp');
const lazypipe = require('lazypipe');
const pump = require('pump');
const rename = require('gulp-rename');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify');

function webpackBuild(filename, libraryName, version) {
  const config = {
    module: {
      loaders: [
        {
          //exclude: /node_modules/,
          test: /\.js$/,
          loader: 'babel',
          query: {
            // Some of the node_modules may have their own "babel" section in
            // their project.json (or a ".babelrc" file). We need to ignore
            // those as we're using our own Babel options.
            babelrc: false,
            presets: ['es2015', 'stage-0'],
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
        'process.env.NODE_ENV': '"production"',
        BABEL_VERSION: JSON.stringify(require('babel-core/package.json').version),
        VERSION: JSON.stringify(version),
      }),
      // Use browser version of visionmedia-debug
      new webpack.NormalModuleReplacementPlugin(
        /debug\/node/,
        'debug/src/browser'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /..\/..\/package/,
        '../../../../src/babel-package-shim'
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

gulp.task('build-babel', cb => {
  pump([
    gulp.src('src/index.js'),
    webpackBuild('babel.js', 'Babel', require('./package.json').version),
    gulp.dest('.'),
    minifyAndRename(),
    gulp.dest('.'),
  ], cb);
});
gulp.task('build-babili', cb => {
  pump([
    gulp.src('src/babili.js'),
    webpackBuild('babili.js', 'Babili', require('./packages/babili-standalone/package.json').version),
    gulp.dest('packages/babili-standalone/'),
    minifyAndRename(),
    gulp.dest('packages/babili-standalone/'),
  ], cb);
});
