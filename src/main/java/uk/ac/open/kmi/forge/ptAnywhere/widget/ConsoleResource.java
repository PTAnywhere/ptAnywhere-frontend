package uk.ac.open.kmi.forge.ptAnywhere.widget;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;


@Path("console")
public class ConsoleResource extends CustomAbstractResource {

    private static Log logger = LogFactory.getLog(ConsoleResource.class);

    private String getReferrerWidgetURL(HttpServletRequest request) {
        final String referrer = request.getHeader("referer");
        if (referrer==null) return null;
        final int paramsAt = referrer.indexOf("?");
        if (paramsAt==-1) return referrer;
        return referrer.substring(0, paramsAt);
    }

    @GET
    @Produces(MediaType.TEXT_HTML)
    public Response getDevice(@QueryParam("endpoint") String consoleEndpoint, @Context HttpServletRequest request) {
        final Map<String, Object> map = new HashMap<String, Object>();
        final String referrerURL = getReferrerWidgetURL(request);
        if (referrerURL!=null) {
            consoleEndpoint = consoleEndpoint + "?widget=" + referrerURL;
        }
        map.put("websocketURL", consoleEndpoint);
        return Response.ok(getPreFilled("/console.ftl", map)).
                link(consoleEndpoint, "endpoint").build();
    }
}