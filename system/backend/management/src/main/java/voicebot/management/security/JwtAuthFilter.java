package voicebot.management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtAuthFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                var jws = jwtProvider.parse(token);
                String userId = jws.getBody().getSubject();
                boolean isRoot = Boolean.TRUE.equals(jws.getBody().get("is_root", Boolean.class));

                var auths = isRoot
                        ? List.of(new SimpleGrantedAuthority("ROLE_ROOT"),
                        new SimpleGrantedAuthority("ROLE_ADMIN"))
                        : List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));

                Authentication auth =
                        new UsernamePasswordAuthenticationToken(userId, null, auths);

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignore) {
            }
        }

        chain.doFilter(request, response);
    }
}
