# grunt-angularjs-test-attribute


## Getting Started
```shell
npm install grunt-angularjs-test-attribute --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-angularjs-test-attribute');
```

## The "replace_attribute" task

### Overview
In your project's Gruntfile, add a section named `test_attribute` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  test_attribute: {
    testPanel: {
      files: [
        {
          expand: true,
          cwd: 'app',
          src: [
            'js/**/*.html',
            '!js/components/service-section/**/*.html'
          ],
          dest: 'test-app'
        }
      ]
    }
  }
});
```