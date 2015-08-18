package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.mvc.MvcFeature;
import org.glassfish.jersey.server.mvc.freemarker.FreemarkerMvcFeature;

import javax.servlet.ServletContext;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Context;


// TODO I would like to get rid of this, but I have not found other way to register Freemarker.
// https://jersey.java.net/documentation/latest/mvc.html#mvc.registration
// https://github.com/jersey/jersey/blob/master/examples/freemarker-webapp/
@ApplicationPath("/app")
public class WidgetApplication extends ResourceConfig {

    public static final String APP_TITLE = "title";
    public static final String APP_ROOT = "path";
    public static final String API_URL = "apiUrl";

    public WidgetApplication(@Context ServletContext servletContext) {
        super(new ResourceConfig().
                        register(FreemarkerMvcFeature.class).
                        packages(WidgetApplication.class.getPackage().getName()).
                        property(MvcFeature.TEMPLATE_BASE_PATH, "templates").
                        property(FreemarkerMvcFeature.CACHE_TEMPLATES, true)
        );

        // Only an object is created per application, so we are not reading the file over and over again.
        final PropertyFileManager pfm = new PropertyFileManager();
        servletContext.setAttribute(APP_TITLE, pfm.getApplicationTitle());
        servletContext.setAttribute(APP_ROOT, pfm.getApplicationPath());
        servletContext.setAttribute(API_URL, pfm.getAPIUrl());
    }
}