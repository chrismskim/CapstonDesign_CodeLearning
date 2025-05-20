package com.projectname.controller;

import com.projectname.service.STTService;
import com.projectname.service.TTSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
public class STTController {

    @Autowired
    private STTService sttService;

    @Autowired
    private TTSService ttsService;

    @PostMapping("/to-text")
    public String convertSpeechToText(@RequestParam("audio") MultipartFile audioFile) {
        return sttService.convertToText(audioFile);
    }

    @PostMapping("/to-speech")
    public byte[] convertTextToSpeech(@RequestParam String text) {
        return ttsService.convertToSpeech(text);
    }
} 