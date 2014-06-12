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

  this._comment_stash = null;

}

SimpleHtmlParser.prototype = {

  handler:  null,

  // regexps

  startTagRe: /^<([^>\s\/]+)((\s+[^=>\s]+(\s*=\s*((\"[^"]*\")|(\'[^']*\')|[^>\s]+))?)*)\s*\/?\s*>/m,
  endTagRe: /^<\/([^>\s]+)[^>]*>/m,
  attrRe:   /([^=\s]+)(\s*=\s*((\"([^"]*)\")|(\'([^']*)\')|[^>\s]+))?/gm,
  

  parse:  function (s, path, oHandler)
  {
    if (oHandler){
      this.contentHandler = oHandler;
    }

    var i = 0;
    var res, lc, lm, rc, index;
    var treatAsChars = false;
    var oThis = this;

    // Flag for outputting translatable inner text
    var tflag_inner_text = false;
    
    while (s.length > 0)
    {
      // Comment
      if (s.substring(0, 4) === "<!--")
      {
        index = s.indexOf("-->");
        if (index !== -1)
        {
          // Test to trigger this comment to store in the most recent comment stash

          // First reset 
          oThis._comment_stash = null;

          var this_comment = s.substring(4, index);

          if(this_comment.match(/translatorcomment/)){
            oThis._comment_stash = this_comment;
            //console.log("stashed: " + this_comment);
          }


          this.contentHandler.comment(s.substring(4, index),path);
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
        // Turnoff tflag_inner_text
        tflag_inner_text = false;


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
            // Check for translation
            if(oThis.parseStartTag_trans_flag.apply(oThis, arguments) === true){
              tflag_inner_text = true;
              console.log("Trans flag set");
            }


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
           this.contentHandler.characters(s,tflag_inner_text,path, oThis._comment_stash);
          s = "";
        }
        else
        {
          this.contentHandler.characters(s.substring(0, index),tflag_inner_text,path, oThis._comment_stash);
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

  parseStartTag_trans_flag:  function (sTag, sTagName, sRest)
  {
    var attrs = this.parseAttributes(sTagName, sRest);
    return this.contentHandler.startElement(sTagName, attrs);
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

  // potfile output string
  this._tr = [];

  // Keep count of the newlines
  this._n_count = 1; 
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
    var ret_val = false;

    if (this._inBlocked){
      return ret_val;
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

    var translate_flag = false;

    for (var i = 0; i < attrs.length; i++)
    {
      translate_flag = this.attribute(sTagName, attrs[i].name, attrs[i].value);
    }

    if(translate_flag === true){
      ret_val = true;
    }

    if (!this._inBlocked){
      this._sb.push(">");
    }

    return ret_val;
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
    var translate_flag = false;

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
    // MSM 12/6/14 translate case
    else if(nl === "translate")
    {
      this._sb.push(" " + "foundtranslate" + "=\"" + sValue + "\"");
      translate_flag = true;
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

    return translate_flag;
  },

  characters: function (s, tflag_inner_text, path, trans_comment)
  {
    

    if (!this._inBlocked){
      this._sb.push(s);
    }

    var newline_match = s.match(/\n/g);
    if(newline_match != null){
      this._n_count = this._n_count + newline_match.length;
    }


    

    // Translation inner text
    if(tflag_inner_text === true){
      
      


      //console.log("trans_comment: " + trans_comment);
      

      var line_num_str = "#: "+ path + ":" + this._n_count.toString() + "\n";
      this._sb.push(line_num_str);
      
      if(trans_comment != null){

        var com_str = "#. " + trans_comment + "\n";

      }
      this._sb.push(com_str);

      var msgid_str = "msgid " + "\"" + s + "\"" + "\n";
      this._sb.push(msgid_str);

      var msgstr_str = "msgstr" + "\"" + "\"" + "\n";
      this._sb.push(msgstr_str);
    }

  },

  comment:  function (s, path)
  {
    var newline_match = s.match(/\n/g);
    if(newline_match != null){
      this._n_count = this._n_count + newline_match.length;
    }

    

    this._sb.push(s);
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
        p.parse(src, filepath);
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
