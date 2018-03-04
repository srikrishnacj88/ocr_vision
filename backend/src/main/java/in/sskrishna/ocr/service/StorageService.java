package in.sskrishna.ocr.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

public interface StorageService {
    String store(MultipartFile file) throws IOException;

    boolean exists(String id);

    File get(String id);
}