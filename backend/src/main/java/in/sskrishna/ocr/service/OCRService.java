package in.sskrishna.ocr.service;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;

public interface OCRService {
    String readText(File file) throws Exception;
}