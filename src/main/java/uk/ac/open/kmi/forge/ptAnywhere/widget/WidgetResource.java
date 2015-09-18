package uk.ac.open.kmi.forge.ptAnywhere.widget;


import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;


@Path("default")
public class WidgetResource extends CustomAbstractResource {

    static String RELATIVE_ROOT_PATH = "../";

    @GET
    @Produces(MediaType.TEXT_HTML)
    public Response getWidget(@QueryParam("session") String sessionId) {
        final Map<String, Object> map = new HashMap<String, Object>();
        map.put("title", getApplicationTitle());
        if (sessionId==null || sessionId.equals("")) {
            map.put("createSession", "true");
            map.put("apiUrl", getAPIURL());
        } else {
            map.put("createSession", "false");
            map.put("apiUrl", getAPIURL() + "/sessions/" + sessionId);
        }
        return Response.ok(getPreFilled("/widget.ftl", map)).
                link(getAPIURL(), "api").build();
    }
}