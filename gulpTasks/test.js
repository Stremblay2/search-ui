const gulp = require('gulp');
const tsc = require('gulp-tsc');
const TestServer = require('karma').Server;
const express = require('express');
const path = require('path');
const rename = require('gulp-rename');
const combineCoverage = require('istanbul-combine');
const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
const event_stream = require('event-stream');
const shell = require('gulp-shell');

const COVERAGE_DIR = path.resolve('bin/coverage');

gulp.task('setupTests', function () {
  return event_stream.merge(
      gulp.src('./test/lib/**/*')
          .pipe(gulp.dest('./bin/tests/lib')),

      gulp.src('./test/SpecRunner.html')
          .pipe(gulp.dest('./bin/tests/'))
  ).pipe(event_stream.wait())
})

gulp.task('coverage', ['lcovCoverage']);

gulp.task('test', ['setupTests', 'buildTest'], function (done) {
  new TestServer({
    configFile: __dirname + '/../karma.conf.js',
  }, () => done()).start();
});

gulp.task('buildTest', shell.task([
  'node node_modules/webpack/bin/webpack.js --config webpack.test.config.js'
]))

gulp.task('testDev', ['watchTest'], function (done) {
  new TestServer({
    configFile: __dirname + '/../karma.dev.conf.js',
  }, done).start();
})

gulp.task('remapCoverage', function (done) {
  return gulp.src(`${COVERAGE_DIR}/coverage-es5.json`)
    .pipe(remapIstanbul({
      exclude: /(webpack|~\/d3\/|~\/es6-promise\/dist\/|~\/process\/|~\/underscore\/|vertx|~\/coveomagicbox\/|~\/modal-box\/|test\/|lib\/)/
    }))
    .pipe(rename('coverage.json'))
    .pipe(gulp.dest(COVERAGE_DIR));
})

gulp.task('lcovCoverage', ['remapCoverage'], function (done) {
  // Convert JSON coverage from remap-istanbul to lcov format (needed for Sonar).
  combineCoverage({
    dir: COVERAGE_DIR,
    pattern: `${COVERAGE_DIR}/coverage.json`,
    reporters: {
      lcov: {}
    }
  }).then(() => done());
})