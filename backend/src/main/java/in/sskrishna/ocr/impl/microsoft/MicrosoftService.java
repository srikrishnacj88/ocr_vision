package in.sskrishna.ocr.impl.microsoft;

import in.sskrishna.ocr.service.OCRService;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.FileEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

@Service
public class MicrosoftService implements OCRService {
    private CloseableHttpClient httpclient = HttpClients.createDefault();

    @Override
    public String readText(File file) throws IOException, URISyntaxException {
        String URL = System.getenv("OCR_MICROSOFT_URL");
        String KEY = System.getenv("OCR_MICROSOFT_KEY");
        Assert.notNull(URL, "Microsoft Cloud OCR URL should not be empty");
        Assert.notNull(KEY, "Microsoft Cloud Subscription key should not be empty");
        System.out.println("Microsoft OCR: processing");
        URIBuilder uriBuilder = new URIBuilder(URL);
        uriBuilder.setParameter("language", "unk");
        uriBuilder.setParameter("detectOrientation", "false");

        URI uri = uriBuilder.build();
        HttpPost request = new HttpPost(uri);

        // Request headers. Replace the example key below with your valid subscription key.
        request.setHeader("Content-Type", "application/octet-stream");
        request.setHeader("Ocp-Apim-Subscription-Key", KEY);

        FileEntity reqEntity = new FileEntity(file, ContentType.APPLICATION_OCTET_STREAM);
        request.setEntity(reqEntity);

        HttpResponse response = httpclient.execute(request);
        HttpEntity entity = response.getEntity();
        System.out.println("Microsoft OCR: finished");
        return EntityUtils.toString(entity);
    }
}