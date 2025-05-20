package com.projectname.service;

import com.projectname.model.CallSession;
import com.projectname.repository.CallSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CallService {

    @Autowired
    private CallSessionRepository callSessionRepository;

    @Autowired
    private STTService sttService;

    @Autowired
    private TTSService ttsService;

    @Autowired
    private LLMAdapterService llmService;

    public String initiateCall(String phoneNumber) {
        CallSession session = new CallSession();
        session.setPhoneNumber(phoneNumber);
        session.setStatus("INITIATED");
        return callSessionRepository.save(session).getId();
    }

    public void endCall(String callId) {
        CallSession session = callSessionRepository.findById(callId)
            .orElseThrow(() -> new RuntimeException("Call session not found"));
        session.setStatus("ENDED");
        callSessionRepository.save(session);
    }
} 