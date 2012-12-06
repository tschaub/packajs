# PackaJS - 101

This basic example shows a minimal application with a single dependency (on jQuery).  Bower is used to install the dependency.  PackaJS is used during development to provide a server for individual, unminified scripts (suitable for debugging).  When application development is complete, PackaJS is used to concatenate and minify the scripts needed by the application.

Have a look at the `component.json` file in this example directory.  This is the standard manifest for Bower packages - name, version, main, and dependencies are all used by Bower.  You'll notice that the "main" value points to a script that doesn't yet exist (`build/js/app.min.js`).  This is the script that PackaJS will build for production.  The "scripts" value is an array of the application sources.  The PackaJS debug server will generate a script loader for these application sources and any dependencies during development.

First, install dependencies with Bower:

    bower install

This should create a `components` directory that contains jQuery.

Now start the debug server (this will load jQuery and your application scripts):

    packa debug

You should now be able to view the application at http://localhost:3000/ - open a debugger to see the `jquery.js` and `app.js` scripts loaded individually.

To prepare the application for development, run the following:

    packa build

This generates a `build/js/app.min.js` file that includes jQuery and your application scripts.  Since `index.html` already pointed to this script, no additional edits are needed to the markup.
