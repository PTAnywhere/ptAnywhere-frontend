package uk.ac.open.kmi.forge.ptAnywhere.widget;

import uk.ac.open.kmi.forge.ptAnywhere.widget.memorable.MemorableNameFactory;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("memorable")
public class MemorableNameResource {
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public Response getMemorablePage(@QueryParam("seed") String seed,
                                     @Context ServletContext servletContext) {
        final MemorableNameFactory factory = (MemorableNameFactory) servletContext.getAttribute(WidgetApplication.NAMEPOOL);
        final String name = (seed==null || seed.equals(""))? factory.getName(): factory.getName(seed);
        return Response.ok(name).build();
    }
}