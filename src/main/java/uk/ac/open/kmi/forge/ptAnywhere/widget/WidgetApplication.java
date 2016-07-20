package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.mvc.MvcFeature;
import org.glassfish.jersey.server.mvc.freemarker.FreemarkerMvcFeature;
import uk.ac.open.kmi.forge.ptAnywhere.widget.memorable.MemorableNameFactory;

import javax.servlet.ServletContext;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Context;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;


// TODO I would like to get rid of this, but I have not found other way to register Freemarker.
// https://jersey.java.net/documentation/latest/mvc.html#mvc.registration
// https://github.com/jersey/jersey/blob/master/examples/freemarker-webapp/
@ApplicationPath("/app")
public class WidgetApplication extends ResourceConfig {

    public static final String PROPERTIES = "properties";
    public static final String NAMEPOOL = "names";


    protected List<String> getLines(String filename) throws IOException {
        final BufferedReader in = new BufferedReader(new InputStreamReader(WidgetApplication.class.getClassLoader().getResourceAsStream(filename)));
        String line = null;

        final List<String> ret = new ArrayList<String>();
        while((line = in.readLine()) != null) {
            ret.add(line);
        }
        return ret;
    }

    public WidgetApplication(@Context ServletContext servletContext) throws IOException {
        super(new ResourceConfig().
                        register(FreemarkerMvcFeature.class).
                        packages(WidgetApplication.class.getPackage().getName()).
                        property(MvcFeature.TEMPLATE_BASE_PATH, "templates").
                        property(FreemarkerMvcFeature.CACHE_TEMPLATES, true)
        );

        // Only an object is created per application, so we are not reading the file over and over again.
        servletContext.setAttribute(PROPERTIES, new PropertyFileManager());
        // Source for names: https://github.com/docker/docker/blob/master/pkg/namesgenerator/names-generator.go
        servletContext.setAttribute(NAMEPOOL, new MemorableNameFactory(getLines("pool1.txt"), getLines("pool2.txt")));
    }
}