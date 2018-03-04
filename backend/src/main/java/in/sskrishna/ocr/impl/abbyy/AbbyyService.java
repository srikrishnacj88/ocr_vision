package in.sskrishna.ocr.impl.abbyy;

import in.sskrishna.ocr.impl.abbyy.sdk.Base64;
import in.sskrishna.ocr.service.OCRService;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.FileEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import org.json.XML;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

@Service
public class AbbyyService implements OCRService {
    private CloseableHttpClient httpclient = HttpClients.createDefault();

    @Override
    public String readText(File file) throws Exception {
        String taskId = this.postImage(file);
        String resultURL = "";
        while (resultURL.equals("")) {
            Thread.sleep(5000);
            resultURL = this.isTaskFinished(taskId);
        }
        return this.getResult(resultURL);
    }

    private String getResult(String resultURL) throws URISyntaxException, IOException {
        URIBuilder uriBuilder = new URIBuilder(resultURL);
        URI uri = uriBuilder.build();
        HttpGet request = new HttpGet(uri);
        HttpResponse response = httpclient.execute(request);
        String json = this.getJson(response).toString();
        System.out.println(json);
        return json;
    }

    public String isTaskFinished(String id) throws URISyntaxException, IOException {
        URIBuilder uriBuilder = new URIBuilder("http://cloud.ocrsdk.com/getTaskStatus");
        uriBuilder.setParameter("taskId", id);

        URI uri = uriBuilder.build();
        HttpGet request = new HttpGet(uri);
        request.setHeader("Authorization", this.auth());
        HttpResponse response = httpclient.execute(request);
        int status = response.getStatusLine().getStatusCode();
        if (status == 200) {
            JSONObject task = this.getJson(response).getJSONObject("response").getJSONObject("task");
            String taskStatus = task.getString("status");
            if (taskStatus.equals("Completed")) {
                String resultURL = task.getString("resultUrl");
                return resultURL;
            }
        } else {
            System.out.println(response.getEntity());
            throw new RuntimeException("unknown error while quering for task");
        }
        return "";
    }

    private String auth() {
        String APPID = System.getenv("OCR_ABBYY_APPID");
        String PASSWD = System.getenv("OCR_ABBYY_PASSWD");
        Assert.notNull(APPID, "ABBYY Cloud OCR APP ID should not be empty");
        Assert.notNull(PASSWD, "ABBYY Cloud PASSWORD should not be empty");

        String auth = APPID + ":" + PASSWD;
        auth = Base64.encode(auth);
        auth = "Basic " + auth;
        auth = auth.replaceAll("\n", "");
        return auth;
    }

    private String postImage(File file) throws Exception {
        System.out.println("ABBYY OCR: uploading img");
        URIBuilder uriBuilder = new URIBuilder("http://cloud.ocrsdk.com/processImage");
        uriBuilder.setParameter("language", "english");
        uriBuilder.setParameter("exportFormat", "xml");

        URI uri = uriBuilder.build();
        HttpPost request = new HttpPost(uri);

        // Request headers. Replace the example key below with your valid subscription key.
        request.setHeader("Content-Type", "application/octet-stream");

        request.setHeader("Authorization", this.auth());

        FileEntity reqEntity = new FileEntity(file, ContentType.APPLICATION_OCTET_STREAM);
        request.setEntity(reqEntity);

        HttpResponse response = httpclient.execute(request);
        JSONObject jsonObj = this.getJson(response);
        String taskId = jsonObj.getJSONObject("response").getJSONObject("task").getString("id");
        System.out.println(jsonObj.toString());
        System.out.println("ABBYY OCR: img uploaded");
        return taskId;
    }

    private JSONObject getJson(HttpResponse response) throws IOException {
        HttpEntity entity = response.getEntity();
        String xml = EntityUtils.toString(entity);
        JSONObject jsonObj = XML.toJSONObject(xml);
        return jsonObj;
    }

    private String getXML(HttpResponse response) throws IOException {
        HttpEntity entity = response.getEntity();
        String xml = EntityUtils.toString(entity);
        return xml;
    }
}
