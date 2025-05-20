package com.projectname.controller;

import com.projectname.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calls")
public class CallController {
    
    @Autowired
    private CallService callService;

    @PostMapping("/initiate")
    public String initiateCall(@RequestParam String phoneNumber) {
        return callService.initiateCall(phoneNumber);
    }

    @PostMapping("/{callId}/end")
    public void endCall(@PathVariable String callId) {
        callService.endCall(callId);
    }
} 