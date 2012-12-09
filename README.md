# PackaJS

Debug server and build utility for [Bower](http://twitter.github.com/bower/) packages.  Bower makes it easy to pull down front-end libraries for your application.  PackaJS helps you debug your scripts during development and prepare them for deployment.

# Installation

Install PackaJS with Node's package management utility.  PackaJS requires [Node 0.8](http://nodejs.org/) or above.

    npm install packa

# Launching the debug server

    packa debug

# Building your application

    packa build

# PackaJS development

If you're interested in contributing to the development of PackaJS, fork the repo and issue a pull request with your changes.

Tests are written with Mocha and can be run with the following:

    npm test

## Build status

[![Current Status](https://secure.travis-ci.org/tschaub/packajs.png?branch=master)](https://travis-ci.org/tschaub/packajs)

See build status history on [Travis](https://travis-ci.org/tschaub/packajs/builds).
