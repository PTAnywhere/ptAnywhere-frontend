package uk.ac.open.kmi.forge.ptAnywhere.widget;


import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;


abstract class DefaultWidgetInterfaceResource extends CustomAbstractResource {

    public Response getWidget(String fileId) {
        final Map<String, Object> map = new HashMap<String, Object>();
        map.put("title", getApplicationTitle());
        map.put("fileToOpen", getFileUrl(fileId));
        map.put("apiUrl", getAPIURL());
        return Response.ok(getPreFilled("/widget.ftl", map)).
                link(getAPIURL(), "api").build();
    }
}

@Path("/")
public class DefaultWidgetResource extends DefaultWidgetInterfaceResource {

    @GET @Path("default.html")
    @Produces(MediaType.TEXT_HTML)
    public Response getDefaultWidget() {
        return super.getWidget("default");
    }

    @GET @Path("demo2.html")
    @Produces(MediaType.TEXT_HTML)
    public Response getSecondDemoWidget() {
        return super.getWidget("demo2");
    }
}