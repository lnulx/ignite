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

var igniteTest = require('../../ignite').test.igniteTest ;

var t = new igniteTest(module) ;

t.regSM([
    {
      entry: t.inject("event"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event"),
      actions: {
        "": "@next"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "event.abc": "@next",
        ".abc": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        ".abc": "@next",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "": "@next"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event.abc.def": "@next",
        ".abc.def": "@error",
        "event.abc": "@error",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        ".abc.def": "@next",
        "event.abc": "@error",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event.abc": "@next",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        ".def": "@next",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "": "@next"
      }
    }]) ;

t.expressoAddRun("events run", [], 'exit') ;