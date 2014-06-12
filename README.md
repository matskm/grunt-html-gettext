> Plugin to enable simple parsing of html files extracting inner text from tags with translate attribute set to yes. Output is pot file for gettext workflow

## Introduction
The June 12th 2104 version fo this plugin is the initial version, and is very much a work in progress. The basic idea is to use the html attribute "translate" to produce gettext pot files. It was very frustrating that no-one else had done this that I could find. In its current incarnation this plugin is definitely not mature (e.g., you have to use the comment string translatorcomment to pick up comments, the options are non-existant). But the code illustrates the approach, and it works for me. Happy to help if you're trying to do the same as me. And I intend to tidy this up. Very much indebted to Erik Arvidsson for his very simple html-parser which underlies this code.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-html-gettext --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-html-gettext');
```

## The "html_gettext" task

### Overview
In your project's Gruntfile, add a section named `html_gettext` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  html_gettext: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  html_gettext: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  html_gettext: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

grunt-html-gettext


Grunt plugin for parsing simple html files, extracting the inner text of tags with the translate attribute set to yes into a pot file for gettext workflow.

