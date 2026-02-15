package com.sdlcassist.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendInviteEmail(String toEmail, String displayName, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("ramseychad1@gmail.com");
        message.setTo(toEmail);
        message.setSubject("SDLC Assist - Your Account Has Been Created");
        message.setText(
                "Hi " + displayName + ",\n\n" +
                "An account has been created for you on SDLC Assist.\n\n" +
                "Username: " + username + "\n" +
                "Password: " + password + "\n\n" +
                "Please log in and try it out: https://sdlc-assist-frontend-production.up.railway.app/\n\n" +
                "— SDLC Assist Admin"
        );

        try {
            mailSender.send(message);
            log.info("Invite email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send invite email to {}", toEmail, e);
        }
    }
}
