# Javascript dependencies

## Custom libraries

We maintain the following libraries in _PTAnywhere_:

*   [ptAnywhere-js](https://github.com/PTAnywhere/ptAnywhere-js)
*   [widget-ui](https://github.com/PTAnywhere/widget-ui)

Both libraries are installed as [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) in _js/custom_.
To handle these submodules easily, I prefer to use the aliases defined in the _Pro Git_ book:

    git config alias.sdiff '!'"git diff && git submodule foreach 'git diff'"
    git config alias.spush 'push --recurse-submodules=on-demand'
    git config alias.supdate 'submodule update --remote --merge'

## Third-party libraries

For your convenience, all the third-party JS dependencies are provided in the _js/third_ directory.
However, all the JS code is maintained in other repositories.
These dependencies are defined using [Bower](http://bower.io) in the _bower.json_ file.

To get these libraries from their original repositories, simply use ``bower install`` (or ``bower update``).

However, bower will also copy them in _js/third_.
Please, ignore these latter subfolders.
