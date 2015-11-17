# PTAnywhere-js

Javascript client for the [PTAnywhere API](https://github.com/PTAnywhere/ptAnywhere-api).


## Download dependencies

To download the dependencies, run the following command:

```
bower update
```

If you don't have [Bower](http://bower.io) installed on your system, run the following first:

```
npm install -g bower
```


## Test it with Jasmine

To test this library using only the [Jasmine testing framework](http://jasmine.github.io) open the file _test/SpecRunner.html_.

Please, note that before running the tests you __need to download the dependencies__.


## Test it with Karma

You can test this library using [Karma](http://karma-runner.github.io) by following these steps:

 * [Install Karma and the needed plugins](http://karma-runner.github.io/0.13/intro/installation.html)

```
npm install karma karma-jasmine karma-chrome-launcher karma-firefox-launcher --save-dev
```

 * Run it

```
./node_modules/karma/bin/karma start
```

Please, note that before running the tests you __need to download the dependencies__.
