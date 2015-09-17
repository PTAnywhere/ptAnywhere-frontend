package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;


@Path("console")
public class ConsoleResource extends CustomAbstractResource {

    private static Log logger = LogFactory.getLog(ConsoleResource.class);

    @GET
    @Produces(MediaType.TEXT_HTML)
    public Response getDevice(@QueryParam("endpoint") String consoleEndpoint) {
        final Map<String, Object> map = new HashMap<String, Object>();
        map.put("websocketURL", consoleEndpoint);
        return Response.ok(getPreFilled("/console.ftl", map)).
                link(consoleEndpoint, "endpoint").build();
    }
}