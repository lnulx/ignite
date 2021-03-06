//[
// Copyright (c) 2011, Richard Miller-Smith & David Hammond.
// All rights reserved. Redistribution and use in source and binary forms, 
// with or without modification, are permitted provided that the following 
// conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of the ignite.js project, nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//]

var ignite = require('ignite'),
    path = require('path'),
    _ = require('underscore.string');

function searchDirectory (fire, regExp, dirPath) {
  var dirListing; 

  this.startState = 'ReadDir';
  this.states = {
    ReadDir: {
      async: {
        fn: 'fs.readdir',
        fnArgs: [ dirPath ]
      },
      actions: {
        '.done': 'DirListingStat',
        '.err': function (err) {
          fire.$factoryEvent('fsErr', err);
          return '@exit';
        }
      },
      exit: function (listing) {
        dirListing = listing;
      }
    },

    DirListingStat: {
      guard: function () {
        if (dirListing.length === 0) {
          return '@exit';
        }
      },
      async: {
        fn: 'fs.lstat',
        fnArgs: function () {
          return [path.join(dirPath, dirListing.shift())];
        }
      },
      actions: {
        '.done': function (stat, fnArgs) {
          if (stat.isFile()) {
            return [ 'ReadFile', fnArgs[0] ];
          } else if (stat.isDirectory()) {
            fire.$factoryEvent('addDir', fnArgs[0]);
          }
          return '@self';
        },
        '.err': function (err) {
          fire.$factoryEvent('fsErr', err);
          return '@self';
        }
      }
    },

    ReadFile: {
      guard: function (fileName) {
        if (!fileName.match(/(?:\.js|\.c|\.cpp)$/)) {
          return 'DirListingStat';
        }
      },
      async: 'fs.readFile',
      actions: {
        '.done': function (data, fnArgs) {
          return [ 'Match', data.toString('utf8'), fnArgs[0] ];
        },
        '.err': function (err) {
          fire.$factoryEvent('fsErr', err);
          return 'DirListingStat';
        }
      }
    },

    Match: {
      work: {
        fn: function (data, fileName) {
          var i, lines, matches = [];
          lines = data.split('\n');
          for (i = 0; i < lines.length; i++) {
            if (lines[i].match(this.regExp)) {
              matches.push({
                lineno: i + 1,
                text: lines[i]
              });
            }
          }
          return ['done', fileName, matches];
        },
        ctx: { regExp: regExp }
      },
      actions: {
        '.done': function (fileName, matches) {
          if (matches.length !== 0) {
            fire.$factoryEvent('addMatch', fileName, matches);
          }
          return 'DirListingStat';
        }
      }
    }
  };
};
searchDirectory.defaults = { 
  imports: { fs: require('fs') },
  options: { 
    logLevel: 0    
// If you want to offload the 'Match' state above to a separate process
// uncomment the following three lines (but, beware this makes it slower
// as the overhead outweighs the benefit).
//    , plugins: {
//      loadAs: { "work": "worker" }
//    }
  }
};

var processorFactory = new ignite.Factory(searchDirectory) ;

function srcGrep (fire, regExp, topDirPath,
                  numOfProcessors) {
  var dirList = [ topDirPath ], numOfProcessors = numOfProcessors || 4,
      results = {};

  this.startState = 'ManageProcessors';
  this.states = {
    ManageProcessors: {
      ticker: 5000,
      entry: function () {
        if (typeof regexp === 'string') {
          regExp = new RegExp(regExp);
        }
        fire.$regEmitter('processor', processorFactory);
        processorFactory.setThreshold.lessthan(numOfProcessors);
      },
      actions: {
        'processor.threshold': function () {
          if (dirList.length !== 0) {
            processorFactory.spawn(regExp, dirList.shift());
          }
        },
        'processor.addDir': function (dir) {
          dirList.push(dir);
        },
        'processor.addMatch': function (fileName, matches) {
          results[fileName] = matches;
        },
        'processor.fsErr': function (err) {
          console.error(err);
        },
        'processor.quiet': function () {
          return [ '@exit', results ];
        },
        'tick': function () {
          console.log(processorFactory.addons.track());
          console.log(JSON.stringify(process.memoryUsage()));
        }
      }
    }
  };
};

srcGrep.defaults = {
  imports: searchDirectory.defaults.imports,
  args: ['ignite', '.'],
  callback: function (err, results) {
    var fileName, matches, i, m;
    if (!err) {
      for (fileName in results) {
        console.log('%s', fileName);
        matches = results[fileName];
        for (i in matches) {
          m = matches[i];
          console.log('%s: %s', 
            _.rpad(String(m.lineno), 4, ' ') , m.text);
        }
      }
    }
  }
};

module.exports = srcGrep;
