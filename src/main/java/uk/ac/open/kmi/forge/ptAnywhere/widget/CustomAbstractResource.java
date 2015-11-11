package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.glassfish.jersey.server.mvc.Viewable;
import javax.servlet.ServletContext;
import javax.ws.rs.core.Context;
import java.util.HashMap;
import java.util.Map;


public abstract class CustomAbstractResource {

    private static Log logger = LogFactory.getLog(CustomAbstractResource.class);

    @Context
    ServletContext servletContext;

    protected PropertyFileManager getProperties() {
        return (PropertyFileManager) servletContext.getAttribute(WidgetApplication.PROPERTIES);
    }

    protected String getApplicationTitle() {
        return getProperties().getApplicationTitle();
    }

    protected String getAppRootURL() {
        return getProperties().getApplicationPath();
    }

    protected String getAPIURL() {
        return getProperties().getAPIUrl();
    }


    protected String getFileUrl(String fileId) {
        return getProperties().getFileUrl(fileId);
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