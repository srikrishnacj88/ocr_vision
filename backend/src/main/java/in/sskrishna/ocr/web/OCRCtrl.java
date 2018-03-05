package in.sskrishna.ocr.web;

import in.sskrishna.ocr.impl.abbyy.AbbyyService;
import in.sskrishna.ocr.impl.google.GoogleService;
import in.sskrishna.ocr.impl.microsoft.MicrosoftService;
import in.sskrishna.ocr.service.OCRService;
import in.sskrishna.ocr.service.StorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@CrossOrigin
public class OCRCtrl {

    private final GoogleService googleService;
    private final MicrosoftService microsoftService;
    private final AbbyyService abbyyService;
    private final StorageService storageService;

    class ID {
        private String id;

        ID(String id) {
            this.id = id;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }
    }

    public OCRCtrl(StorageService storageService, GoogleService googleService, MicrosoftService microsoftService, AbbyyService abbyyService) {
        this.storageService = storageService;
        this.googleService = googleService;
        this.microsoftService = microsoftService;
        this.abbyyService = abbyyService;
    }

    @RequestMapping(value = "/upload", method = RequestMethod.POST)
    public ResponseEntity<ID> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String id = this.storageService.store(file);
        return new ResponseEntity<ID>(new ID(id), HttpStatus.OK);
    }

    @GetMapping(path = "/google/{id}", produces = "application/json")
    public ResponseEntity<String> googleOCR(@PathVariable("id") String id) throws Exception {
        return this.service(id, googleService);
    }

    @GetMapping(path = "/microsoft/{id}", produces = "application/json")
    public ResponseEntity<String> microsoftOCR(@PathVariable("id") String id) throws Exception {
        return this.service(id, microsoftService);
    }

    @GetMapping(path = "/abbyy/{id}", produces = "application/json")
    public ResponseEntity<String> abbyyOCR(@PathVariable("id") String id) throws Exception {
        return this.service(id, abbyyService);
    }

    private ResponseEntity<String> service(String id, OCRService service) throws Exception {
        if (this.storageService.exists(id)) {
            File file = this.storageService.get(id);
            String response = service.readText(file);
            return new ResponseEntity<String>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping(path = "/image/{id}", produces = "application/json")
    public ResponseEntity<Resource> image(@PathVariable("id") String id) throws Exception {
        if (this.storageService.exists(id)) {
            File file = this.storageService.get(id);

            Path path = Paths.get(file.getAbsolutePath());
            ByteArrayResource resource = new ByteArrayResource(Files.readAllBytes(path));

            return ResponseEntity.ok()
                    .contentLength(file.length())
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
        } else {
            return new ResponseEntity<Resource>(HttpStatus.NOT_FOUND);
        }
    }
}