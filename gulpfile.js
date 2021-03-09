/* Inspired by Utlimate Jay Mega Gulpfile */
/* https://github.com/jaysalvat/vegas/blob/master/gulpfile.js */
/* global require:true, process:true */
/* jshint laxbreak:true */

(function() {
    'use strict';

    var pkg        = require('./package.json'),
        del        = require('del'),
        yargs      = require('yargs'),
        exec       = require('child_process').exec,
        fs         = require('fs'),
        dateFormat = require('dateformat'),
        spawn      = require('child_process').spawn,
        gulp       = require('gulp'),
        plugins    = require('gulp-load-plugins')();

    /*
        --type major        : bumps from ie. 2.0.0 -> 3.0.0
        --type minor        : bumps from ie. 2.0.0 -> 2.1.0
        --type patch        : bumps from ie. 2.0.0 -> 2.0.1
        --type prerelease   : bumps from ie. 2.0.0 -> 2.0.0-1
    */
    var bumpVersion = yargs.argv.type || 'patch';
    var now         = new Date();

    var settings = {
        name: 'standoutjs',
        banner: {
            content: [
                '/*!-----------------------------------------------------------------------------',
                ' * <%= pkg.description %>',
                ' * v<%= pkg.version %> - built <%= datetime %>',
                ' * Licensed under the MIT License.',
                ' * https://github.com/DonnieRich/standoutjs',
                ' * ----------------------------------------------------------------------------',
                ' * Copyright (C) 2020-<%= year %> Donato Pasquale Riccio',
                ' * https://designaddicted.eu/',
                ' * --------------------------------------------------------------------------*/',
                ''
            ].join('\n'),
            vars: {
                pkg: pkg,
                datetime: dateFormat(now, 'yyyy-MM-dd'),
                year: dateFormat(now, 'yyyy')
            }
        }
    };

    const getPackageJson = function() {
        return JSON.parse(fs.readFileSync('./package.json'));
    };

    function clean(cb) {
        return del([ './dist' ], cb);
    }

    exports.clean = clean;

    function failIfDirty(cb) {
        return exec('git diff-index HEAD --', function(err, output) {
            if (err) {
                return cb(err);
            }
            if (output) {
                return cb('Repository is dirty');
            }
            return cb();
        });
    }

    function failIfNotMain(cb) {
        exec('git symbolic-ref -q HEAD', function(err, output) {
            if (err) {
                return cb(err);
            }
            if (!/refs\/heads\/main/.test(output)) {
                return cb('Branch is not Main');
            }
            return cb();
        });
    }

    exports.failIfNotMain = failIfNotMain;

    function gitTag(cb) {
        const message = 'v' + getPackageJson().version;

        return exec('git tag ' + message, cb);
    }

    exports.gitTag = gitTag;

    function gitAdd(cb) {
        return exec('git add -A', cb);
    }

    exports.gitAdd = gitAdd;

    function gitCommit(cb) {
        const message = 'Build v' + getPackageJson().version;

        return exec('git commit -m "' + message + '"', cb);
    }

    exports.gitCommit = gulp.series(gitAdd, gitCommit);

    function gitPull(cb) {
        return exec('git pull origin main', function(err, output, code) {
            if (code !== 0) {
                return cb(err + output);
            }
            return cb();
        });
    }

    exports.gitPull = gitPull;

    function gitPush(cb) {
        return exec('git push origin main --tags', function(err, output, code) {
            if (code !== 0) {
                return cb(err + output);
            }
            return cb();
        });
    }

    exports.gitCommit = gulp.series(gitAdd, gitCommit, gitPush);

    function npmPublish(cb) {
        exec('npm publish', function(err, output, code) {
            if (code !== 0) {
                return cb(err + output);
            }
            return cb();
        });
    }

    exports.npmPublish = npmPublish;

    function meta(cb) {
        const metadata = {
                date: dateFormat(now, 'yyyy-MM-dd HH:MM'),
                version: 'v' + getPackageJson().version
            },
            json = JSON.stringify(metadata, null, 4);

        fs.writeFileSync('tmp/metadata.json', json);
        fs.writeFileSync('tmp/metadata.js', '__metadata(' + json + ');');

        return cb();
    }

    function bump() {
        return gulp.src([ 'package.json' ])
            .pipe(plugins.bump(
                /^[a-z]+$/.test(bumpVersion)
                    ? { type: bumpVersion }
                    : { version: bumpVersion }
            ))
            .pipe(gulp.dest('.'));
    }

    exports.npmPublish = npmPublish;

    function year() {
        return gulp.src([ './README.md' ])
            .pipe(plugins.replace(/(Copyright )(\d{4})/g, '$1' + dateFormat(now, 'yyyy')))
            .pipe(gulp.dest('.'));
    }

    exports.year = year;

    function lint() {
        return gulp.src('./src/**.js')
            .pipe(plugins.eslint({}))
            .pipe(plugins.eslint.format());
    }

    exports.lint = lint;

    function copy() {
        return gulp.src([ './src/**/*', '!./src/sass', '!./src/sass/**' ])
            .pipe(gulp.dest('./dist'));
    }

    exports.copy = copy;

    function docs() {
        return gulp.src(['./dist/**.js'])
            .pipe(gulp.dest('./docs/demo/js'));
    }

    exports.docs = docs;

    function uglify() {
        return gulp.src('./dist/**/!(*.min.js).js')
            .pipe(plugins.rename({ suffix: '.min' }))
            .pipe(plugins.sourcemaps.init())
            .pipe(plugins.terser({
                compress: {},
                keep_fnames: true,
                output: {
                    comments: /^!/
                }
            }))
            .on('error', function(err) { console.log(err) })
            .pipe(plugins.sourcemaps.write('.'))
            .pipe(gulp.dest('./dist/'));
    }

    exports.copy = copy;

    function header() {
        settings.banner.vars.pkg = getPackageJson();

        return gulp.src('./dist/*.js')
            .pipe(plugins.header(settings.banner.content, settings.banner.vars ))
            .pipe(gulp.dest('./dist/'));
    }

    exports.header = header;

    function changelog(cb) {
        var filename  = 'CHANGELOG.md',
            version   = getPackageJson().version,
            date      = dateFormat(now, 'yyyy-mm-dd'),
            changelog = fs.readFileSync(filename).toString(),
            lastDate =  dateFormat(fs.statSync(filename).mtime, 'yyyy-mm-dd');

        exec('git log --since="' + lastDate + ' 00:00:00" --oneline --pretty=format:"%s"', function(err, stdout) {
            if (err) {
                return cb(err);
            }

            if (!stdout) {
                return cb();
            }

            let prefixes = ['(new)', '(fix)', '(chg)'];
            let changes = {};

            prefixes.forEach(p => {
                changes[p] = stdout.split('\n').filter( line => {
                    return line.indexOf(p) !== -1;
                }).join('\n').replace(/ *\([^)]*\) */g,'').replace(/\n/g, '\n* ');
            });

            const updates = [
                '### Standout ' + version + ' ' + date,
                '',
                '#### New',
                '* ' + changes['(new)'],
                '',
                '#### Fix',
                '* ' + changes['(fix)'],
                '',
                '#### Changes',
                '* ' + changes['(chg)']
            ].join('\n');

            changelog = changelog.replace(/(## CHANGE LOG)/, '$1\n\n' + updates);

            fs.writeFile(filename, changelog, function(err) {
                return cb();
            });
        });
    }

    exports.changelog = changelog;

    function watch() {
        return gulp.watch("./src/**/*", build);
    }

    exports.watch = watch;
    exports.default = watch;

    const build = gulp.series(
        lint,
        clean,
        copy,
        header,
        uglify,
        docs
    );

    exports.build = build;

    const release = gulp.series(
        failIfNotMain, 
        failIfDirty,
        gitPull,
        //bump,
        changelog,
        year,
        clean,
        copy,
        header,
        uglify,
        docs,
        // gitAdd,
        // gitCommit,
        // gitTag,
        // gitPush,
        // npmPublish
    );

    exports.release = release;
})();

/*

NPM Installation
----------------

npm install --save-dev del
npm install --save-dev yargs
npm install --save-dev exec
npm install --save-dev gulp-eslint
npm install --save-dev eslint-config-airbnb-base eslint-plugin-import
npm install --save-dev gulp
npm install --save-dev gulp-load-plugins
npm install --save-dev gulp-bump
npm install --save-dev gulp-header
npm install --save-dev gulp-autoprefixer
npm install --save-dev gulp-terser
npm install --save-dev gulp-sourcemaps
npm install --save-dev gulp-jshint
npm install --save-dev gulp-zip
npm install --save-dev gulp-rename
npm install --save-dev gulp-replace

*/