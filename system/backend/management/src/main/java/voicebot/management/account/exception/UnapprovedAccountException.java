package voicebot.management.account.exception;

import org.springframework.security.core.AuthenticationException;

public class UnapprovedAccountException extends AuthenticationException {
    public UnapprovedAccountException(String msg, Throwable cause) {
        super(msg, cause);
    }

    public UnapprovedAccountException(String msg) {
        super(msg);
    }
} 