package in.sskrishna.ocr.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

public class Hash {
    public static String md5(File file) throws FileNotFoundException {
        try (FileInputStream fis = new FileInputStream(file)) {
            String md5 = org.apache.commons.codec.digest.DigestUtils.md5Hex(fis);
            fis.close();
            return md5;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "";
    }
}
