package in.sskrishna.ocr.service;

import java.io.File;

public interface OCRService {
    String readText(File file, String hash) throws Exception;
}