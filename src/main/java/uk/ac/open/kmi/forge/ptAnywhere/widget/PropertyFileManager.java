package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import java.io.IOException;
import java.util.Properties;


public class PropertyFileManager {

    private static final Log LOGGER = LogFactory.getLog(PropertyFileManager.class);

    Properties props = new Properties();

    public PropertyFileManager() {
        try {
            this.props.load(PropertyFileManager.class.getClassLoader().getResourceAsStream("environment.properties"));
        } catch(IOException e) {
            LOGGER.error("The properties file could not be read.");
        }
    }

    /**
     * @return Application title.
     */
    public  String getApplicationTitle() {
        return this.props.getProperty("title", "Widget");
    }

    /**
     * @return The widgets in this webapp will use the following API.
     */
    public  String getAPIUrl() {
        return this.props.getProperty("ptAnywhere.api");
    }

    /**
     * @return
     *  Application path under the webserver.
     *  For example: "/" or "/context1/"
     */
    public  String getApplicationPath() {
        final String prop = this.props.getProperty("tomcat.path", "/");
        if (prop.endsWith("/"))
            return prop.substring(0, prop.length()-1);
        return prop + "/";
    }
}