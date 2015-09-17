package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.glassfish.jersey.server.mvc.Viewable;
import javax.servlet.ServletContext;
import javax.ws.rs.core.Context;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;


public abstract class CustomAbstractResource {

    private static Log logger;
    private static Properties properties;


    static {
        logger = LogFactory.getLog(WidgetResource.class);
        properties = new Properties();  // It does not change once the app has been deployed.
    }

    @Context
    ServletContext servletContext;

    protected String getApplicationTitle() {
        return (String) servletContext.getAttribute(WidgetApplication.APP_TITLE);
    }

    String getAppRootURL() {
        return (String) servletContext.getAttribute(WidgetApplication.APP_ROOT);
    }

    String getAPIURL() {
        return (String) servletContext.getAttribute(WidgetApplication.API_URL);
    }

    public Viewable getPreFilled(String path) {
        return getPreFilled(path, new HashMap<String, Object>());
    }

    public Viewable getPreFilled(String path, Map<String, Object> map) {
        map.put("base", getAppRootURL() + "static");
        map.put("api", getAPIURL());
        return (new Viewable(path, map));
    }
}