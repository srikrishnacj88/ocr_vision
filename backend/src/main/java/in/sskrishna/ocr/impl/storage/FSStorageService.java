package in.sskrishna.ocr.impl.storage;

import org.apache.commons.io.FileUtils;
import in.sskrishna.ocr.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class FSStorageService implements StorageService {
    private Map<String, File> fileMap = new HashMap<>();

    @Override
    public String store(MultipartFile file) throws IOException {
        String UUID = java.util.UUID.randomUUID().toString().replaceAll("-","");
        File temp = File.createTempFile("ocr", "vision");
        System.out.println(temp.getAbsoluteFile());
        temp.deleteOnExit();
        FileUtils.copyInputStreamToFile(file.getInputStream(), temp);
        this.fileMap.put(UUID, temp);
        return UUID;
    }

    @Override
    public boolean exists(String id) {
        return this.fileMap.containsKey(id);
    }

    @Override
    public File get(String id) {
        return this.fileMap.get(id);
    }
}