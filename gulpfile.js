/**
 * Copyright (C) 2016 Michael Kourlas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var gulp = require("gulp");
var merge2 = require("merge2");
var sourcemaps = require("gulp-sourcemaps");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");

gulp.task("default", ["prod"]);

var tsProject = ts.createProject("tsconfig.json");
gulp.task("prod", function() {
    var tsResult = tsProject.src()
                            .pipe(tslint())
                            .pipe(tslint.report())
                            .pipe(tsProject(ts.reporter.longReporter()));
    return merge2([tsResult.js
                           .pipe(gulp.dest("lib")),
                   tsResult.dts
                           .pipe(gulp.dest("lib"))]);
});
gulp.task("dev", function() {
    var tsResult = tsProject.src()
                            .pipe(tslint())
                            .pipe(tslint.report())
                            .pipe(sourcemaps.init())
                            .pipe(tsProject(ts.reporter.longReporter()));
    return merge2([tsResult.js
                           .pipe(sourcemaps.write())
                           .pipe(gulp.dest("lib")),
                   tsResult.dts
                           .pipe(gulp.dest("lib"))]);
});
