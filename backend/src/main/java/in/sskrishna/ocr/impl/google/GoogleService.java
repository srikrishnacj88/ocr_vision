package in.sskrishna.ocr.impl.google;

import com.google.cloud.vision.v1.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.protobuf.ByteString;
import in.sskrishna.ocr.service.OCRService;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoogleService implements OCRService {
    //    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static final Gson gson = new GsonBuilder().create();
    private Map<String, String> responseCache = new HashMap<String, String>();

    @Override
    public String readText(File file, String hash) throws IOException {
        synchronized (hash) {
            if (responseCache.containsKey(hash)) {
                return this.responseCache.get(hash);
            }

            System.out.println("Google OCR: processing file");
            PrintStream out = System.out;
            List<AnnotateImageRequest> requests = new ArrayList<>();

            ByteString imgBytes = ByteString.readFrom(new FileInputStream(file));

            Image img = Image.newBuilder().setContent(imgBytes).build();
            Feature feat = Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder().addFeatures(feat).setImage(img).build();
            requests.add(request);

            try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {
                BatchAnnotateImagesResponse response = client.batchAnnotateImages(requests);
                List<AnnotateImageResponse> responses = response.getResponsesList();
                client.close();

                for (AnnotateImageResponse res : responses) {
                    if (res.hasError()) {
                        out.printf("Error: %s\n", res.getError().getMessage());
                        throw new RuntimeException("Error Google OCR");
                    }

                    // For full list of available annotations, see http://g.co/cloud/vision/docs
                    TextAnnotation annotation = res.getFullTextAnnotation();
                    System.out.println("Google OCR: finished");

                    String responseToCache = gson.toJson(annotation);
                    this.responseCache.put(hash, responseToCache);
                    return responseToCache;
                }
            } catch (Exception e) {
                throw new RuntimeException("Error Google OCR", e);
            }
            return null;
        }
    }
}