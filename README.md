# PT Anywhere widgets

JavaScript library for the [PT Anywhere HTTP API](https://github.com/PTAnywhere/ptAnywhere-api) and some HTML widgets which use it.
Both components are being developed as part of the [FORGE](http://ict-forge.eu/) project.
For more information about _PT Anywhere_, please check [its official website](http://pt-anywhere.kmi.open.ac.uk).


## Usage

As this project uses Maven, you can compile and deploy it using the following command:

    mvn clean exec:exec

By default, the app will be deployed in the development server.
Use any of the following commands to deploy it in other environments:

    mvn clean exec:exec -Denv=devel  # Development environment (explicitly stated)
    mvn clean exec:exec -Denv=test  # Testing environment
    mvn clean exec:exec -Denv=prod  # Production environment

Additionally, you can also define your own environment in a property file.
The easiest way to do this is by using an existing property file as a template (e.g., the development environment one).
If you choose this approach, use the following command:

    mvn exec:exec -Denv=custom -DpropFile=[PATH-TO-YOUR-PROPERTY-FILE]

Please, note that you need to [configure your web server](http://www.mkyong.com/maven/how-to-deploy-maven-based-war-file-to-tomcat/) before using the tomcat deployment command shown above.
If you are using Tomcat6, you might need to [consider this too](http://stackoverflow.com/questions/8726987/cant-access-tomcat-6-manager-app).