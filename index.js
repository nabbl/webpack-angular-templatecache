const htmlMinifier = require("html-minifier");
const glob = require("glob");
const fs = require("fs");
const Chunk = require('webpack/lib/Chunk');
const EntryPoint = require('webpack/lib/Entrypoint');
const RawSource = require('webpack-sources/lib/RawSource');
const path = require('path');

class TemplateCachePlugin {

  constructor(options) {
    this.options = options;
  }
  apply(compiler) {

    var minifyOptions = {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      preserveLineBreaks: false
    }

    compiler.hooks.compilation.tap(
      'TemplateCachePlugin',
      (compilation) => {
        compilation.hooks.additionalAssets.tapAsync(
          'TemplateCachePlugin',
          (cb) => {
            var filelist = 'angular.module("' + this.options.moduleName + '").run(["$templateCache",function($templateCache){"use strict";';

            var files = glob.sync(this.options.baseFolder + "**/*.html", {});

            for (var filename of files) {
              if (filename.substr(-4) === 'html') {
                let fullpath = path.resolve(filename);
                // adds this file to being watched by webpack for a rebuild
                compilation.fileDependencies.add(fullpath);
                var source = fs.readFileSync(filename);
                source = source.toString();
                source = htmlMinifier.minify(source, minifyOptions);
                source = source.replace(/\r?\n|\r/g, "");
                source = source.replace(/\\/g, "\\\\");
                source = source.replace(/'/g, "\\'");
                source = source.replace(/"/g, "\\\"");
                // remove basefolder we dont want to have in path
                if (this.options.base) {
                  filename = filename.substring(this.options.base.length, filename.length);
                }
                // if we have a target put all the files directly there
                if (this.options.target) {
                  filename = this.options.target + path.basename(filename);
                }
                filelist += (`$templateCache.put("${ filename }", "${ source }" ); \n`);
              }
            }

            filelist += '}]);';

            // Insert this list into the Webpack build as a new file asset:
            this._insertOutput(compilation, 'templates.js', filelist);

            cb();
          });

      });
  }

  _insertOutput(compilation, filename, source) {
    const chunk = new Chunk("templates.js");
    chunk.id = "templates.js";
    chunk.ids = [chunk.id];
    chunk.files.push(filename);

    const entrypoint = new EntryPoint("templates.js");
    entrypoint.pushChunk(chunk);

    compilation.entrypoints.set("templates.js", entrypoint);
    compilation.chunks.push(chunk);
    compilation.assets[filename] = new RawSource(source);
  }
}

module.exports = TemplateCachePlugin;
