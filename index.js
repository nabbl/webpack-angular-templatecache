var htmlMinifier = require("html-minifier");

class TemplateCachePlugin {


  constructor(options) {}
  apply(compiler) {

    var minifyOptions = {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      preserveLineBreaks: false
    }

    compiler.hooks.additionalAssets.tapAsync.tapAsync(
      'TemplateCachePlugin',
      (compilation, callback) => {
        // Manipulate the build using the plugin API provided by webpack
        // Create a header string for the generated file:

        var filelist = 'angular.module("easySales").run(["$templateCache",function($templateCache){"use strict";';
        // Loop through all compiled assets,
        for (var filename in compilation.assets) {
          if (filename.substr(-4) === 'html') {
            var source = compilation.assets[filename].source();
            source = source.toString();
            source = htmlMinifier.minify(source, minifyOptions);
            source = source.replace(/\r?\n|\r/g, "");
            source = source.replace(/'/g, "\\'");
            source = source.replace(/"/g, "\\\"");
            filelist += (`$templateCache.put("${ filename }", "${ source }" ); `);
            //remove HTML files
            delete compilation.assets[filename];
          }
        }

        filelist += '}]);';

        // Insert this list into the Webpack build as a new file asset:
        compilation.assets['templates.js'] = {
          source: function () {
            return filelist;
          },
          size: function () {
            return filelist.length;
          }
        };
        callback();
      });
  }
}

module.exports = TemplateCachePlugin;
