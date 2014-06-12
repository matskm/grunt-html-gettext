/*
 * grunt-html-gettext
 * https://github.com/matskm/grunt-html-gettext
 *
 * Copyright (c) 2014 Mat Martin
 * Licensed under the MIT license.
 */

'use strict';



// Parser follows
// Original: Copyright 2004 Erik Arvidsson. All Rights Reserved.

function SimpleHtmlParser()
{
}

SimpleHtmlParser.prototype = {

  handler:  null,

  // regexps

  startTagRe: /^<([^>\s\/]+)((\s+[^=>\s]+(\s*=\s*((\"[^"]*\")|(\'[^']*\')|[^>\s]+))?)*)\s*\/?\s*>/m,
  endTagRe: /^<\/([^>\s]+)[^>]*>/m,
  attrRe:   /([^=\s]+)(\s*=\s*((\"([^"]*)\")|(\'([^']*)\')|[^>\s]+))?/gm,

  parse:  function (s, oHandler)
  {
    if (oHandler){
      this.contentHandler = oHandler;
    }

    var i = 0;
    var res, lc, lm, rc, index;
    var treatAsChars = false;
    var oThis = this;
    
    while (s.length > 0)
    {
      // Comment
      if (s.substring(0, 4) === "<!--")
      {
        index = s.indexOf("-->");
        if (index !== -1)
        {
          this.contentHandler.comment(s.substring(4, index));
          s = s.substring(index + 3);
          treatAsChars = false;
        }
        else
        {
          treatAsChars = true;
        }
      }

      // end tag
      else if (s.substring(0, 2) === "</")
      {
        if (this.endTagRe.test(s))
        {
          lc = RegExp.leftContext;
          lm = RegExp.lastMatch;
          rc = RegExp.rightContext;

          lm.replace(this.endTagRe, function ()
          {
            return oThis.parseEndTag.apply(oThis, arguments);
          });

          s = rc;
          treatAsChars = false;
        }
        else
        {
          treatAsChars = true;
        }
      }
      // start tag
      else if (s.charAt(0) === "<")
      {
        if (this.startTagRe.test(s))
        {
          lc = RegExp.leftContext;
          lm = RegExp.lastMatch;
          rc = RegExp.rightContext;

          lm.replace(this.startTagRe, function ()
          {
            return oThis.parseStartTag.apply(oThis, arguments);
          });

          s = rc;
          treatAsChars = false;
        }
        else
        {
          treatAsChars = true;
        }
      }

      if (treatAsChars)
      {
        index = s.indexOf("<");
        if (index === -1)
        {
           this.contentHandler.characters(s);
          s = "";
        }
        else
        {
          this.contentHandler.characters(s.substring(0, index));
          s = s.substring(index);
        }
      }

      treatAsChars = true;
    }
  },

  parseStartTag:  function (sTag, sTagName, sRest)
  {
    var attrs = this.parseAttributes(sTagName, sRest);
    this.contentHandler.startElement(sTagName, attrs);
  },

  parseEndTag:  function (sTag, sTagName)
  {
    this.contentHandler.endElement(sTagName);
  },

  parseAttributes:  function (sTagName, s)
  {
    var oThis = this;
    var attrs = [];
    s.replace(this.attrRe, function (a0, a1, a2, a3, a4, a5, a6)
    {
      attrs.push(oThis.parseAttribute(sTagName, a0, a1, a2, a3, a4, a5, a6));
    });
    return attrs;
  },

  parseAttribute: function (sTagName, sAttribute, sName)
  {
    var value = "";
    if (arguments[7]){
      value = arguments[8];
    }
    else if (arguments[5]){
      value = arguments[6];
    }
    else if (arguments[3]){
      value = arguments[4];
    }

    var empty = !value && !arguments[3];
    return {name: sName, value: empty ? null : value};
  }
};





// Filter hander follows:

/**
 * This class creates a simple handler for SimpleHtmlParser that filters out
 * potentially unsafe HTML code
 */
function FilterHtmlHandler()
{
  this._sb = [];
}

FilterHtmlHandler.prototype = {

  _inBlocked: null,

  clear:  function ()
  {
    this._sb = [];
  },

  toString: function ()
  {
    return this._sb.join("");
  },

// handler interface

  startElement:   function (sTagName, attrs)
  {
    if (this._inBlocked){
      return;
    }

    var ls = sTagName.toLowerCase();
    switch (ls) {
      case "script":
      case "style":
      case "applet":
      case "object":
      case "embed": //does embed have optional end tag?
        this._inBlocked = ls;
        break;
      default:
        this._sb.push("<" + sTagName);
    }

    for (var i = 0; i < attrs.length; i++)
    {
      this.attribute(sTagName, attrs[i].name, attrs[i].value);
    }

    if (!this._inBlocked){
      this._sb.push(">");
    }
  },

  endElement:     function (s)
  {
    var ls = s.toLowerCase();
    if (this._inBlocked)
    {
      if (this._inBlocked === ls){
        this._inBlocked = null;
      }
      return;
    }
    this._sb.push("</" + s + ">");
  },

  attribute:  function (sTagName, sName, sValue)
  {
    if (this._inBlocked){
      return;
    }

    var nl = sName.toLowerCase();
    var vl = String(sValue).toLowerCase();  // might be null

    if (nl === "type" && vl === "text/css" ||
      nl === "rel" && vl === "stylesheet")
    {
      this._sb.push(" " + sName + "=\"BLOCKED\"");
    }
    else if (nl.substr(0,2) === "on")
    {
      //noop
    }
    else if ((nl === "href" || nl === "src" || nl === "data" || nl === "codebase") &&
         /^javascript\:/i.test(vl))
    {
      //noop
    }
    else if (nl === "style")
    {
      sValue = sValue.replace(/\-moz\-binding/gi, "BLOCKED")
          .replace(/binding/gi, "BLOCKED")
          .replace(/behavior/gi, "BLOCKED")
          .replace(/\:\s*expression\s*\(/gi, ":BLOCKED(");
      this._sb.push(" " + sName + "=\"" + sValue + "\"");
    }
    else
    {
      if (sValue == null){
        this._sb.push(" " + sName);
      }
      else{
        this._sb.push(" " + sName + "=\"" + sValue + "\"");
      }
    }
  },

  characters: function (s)
  {
    if (!this._inBlocked){
      this._sb.push(s);
    }
  },

  comment:  function (s)
  {
    //this._sb.push(s);
  }
};











// Grunt code follows

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('html_gettext', 'Simple attribute based html-->gettext parsing', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        
        var exec = require('child_process').exec;
        var done = grunt.task.current.async(); 

        // Read file source.
        var src = grunt.file.read(filepath);

        // Do stuff here.
        var p = new SimpleHtmlParser();
        var f = new FilterHtmlHandler();

        // Attach the content handler to the parser
        p.contentHandler = f;
        // Do the parsing
        p.parse(src);
        // Return the result
        return f.toString();

      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};
