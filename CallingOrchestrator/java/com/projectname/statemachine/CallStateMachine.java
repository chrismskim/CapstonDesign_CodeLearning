package com.projectname.statemachine;

import org.springframework.stereotype.Component;

@Component
public class CallStateMachine {
    
    private CallState currentState = CallState.IDLE;
    
    public CallState getCurrentState() {
        return currentState;
    }
    
    public void transitionTo(CallState newState) {
        // TODO: Implement state transition logic with validation
        currentState = newState;
    }
    
    public boolean canTransitionTo(CallState newState) {
        // TODO: Implement state transition validation logic
        return true;
    }
} 