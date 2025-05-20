package com.projectname.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class STTService {

    public String convertToText(MultipartFile audioFile) {
        // TODO: Implement speech-to-text conversion logic
        return "Converted text from audio";
    }
} 