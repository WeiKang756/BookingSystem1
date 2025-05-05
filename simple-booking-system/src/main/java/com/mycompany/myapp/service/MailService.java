package com.mycompany.myapp.service;

import com.mycompany.myapp.domain.User;
import com.mycompany.myapp.service.dto.AppointmentDTO;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import tech.jhipster.config.JHipsterProperties;

/**
 * Service for sending emails.
 * <p>
 * We use the {@link Async} annotation to send emails asynchronously.
 */
@Service
public class MailService {

    private final Logger log = LoggerFactory.getLogger(MailService.class);

    private static final String USER = "user";

    private static final String BASE_URL = "baseUrl";

    private static final String APPOINTMENT = "appointment";

    private static final String APPOINTMENT_DATETIME = "appointmentDateTime";

    private static final String SERVICE_NAME = "serviceName";

    private final JHipsterProperties jHipsterProperties;

    private final JavaMailSender javaMailSender;

    private final MessageSource messageSource;

    private final SpringTemplateEngine templateEngine;

    public MailService(
        JHipsterProperties jHipsterProperties,
        JavaMailSender javaMailSender,
        MessageSource messageSource,
        SpringTemplateEngine templateEngine
    ) {
        this.jHipsterProperties = jHipsterProperties;
        this.javaMailSender = javaMailSender;
        this.messageSource = messageSource;
        this.templateEngine = templateEngine;
    }

    @Async
    public void sendEmail(String to, String subject, String content, boolean isMultipart, boolean isHtml) {
        log.debug(
            "Send email[multipart '{}' and html '{}'] to '{}' with subject '{}' and content={}",
            isMultipart,
            isHtml,
            to,
            subject,
            content
        );

        // Prepare message using a Spring helper
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, isMultipart, StandardCharsets.UTF_8.name());
            message.setTo(to);
            message.setFrom(jHipsterProperties.getMail().getFrom());
            message.setSubject(subject);
            message.setText(content, isHtml);
            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", to);
        } catch (MailException | MessagingException e) {
            log.warn("Email could not be sent to user '{}'", to, e);
        }
    }

    @Async
    public void sendEmailFromTemplate(User user, String templateName, String titleKey) {
        if (user.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", user.getLogin());
            return;
        }
        Locale locale = Locale.forLanguageTag(user.getLangKey());
        Context context = new Context(locale);
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());
        String content = templateEngine.process(templateName, context);
        String subject = messageSource.getMessage(titleKey, null, locale);
        sendEmail(user.getEmail(), subject, content, false, true);
    }

    @Async
    public void sendActivationEmail(User user) {
        log.debug("Sending activation email to '{}'", user.getEmail());
        sendEmailFromTemplate(user, "mail/activationEmail", "email.activation.title");
    }

    @Async
    public void sendCreationEmail(User user) {
        log.debug("Sending creation email to '{}'", user.getEmail());
        sendEmailFromTemplate(user, "mail/creationEmail", "email.activation.title");
    }

    @Async
    public void sendPasswordResetMail(User user) {
        log.debug("Sending password reset email to '{}'", user.getEmail());
        sendEmailFromTemplate(user, "mail/passwordResetEmail", "email.reset.title");
    }

    @Async
    public void sendAppointmentConfirmationEmail(User user, AppointmentDTO appointment) {
        log.debug("Sending appointment confirmation email to '{}'", user.getEmail());
        if (user.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", user.getLogin());
            return;
        }

        Locale locale = Locale.forLanguageTag(user.getLangKey());
        Context context = new Context(locale);
        context.setVariable(USER, user);
        context.setVariable(APPOINTMENT, appointment);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        // Format the date and time for better readability
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a").withZone(ZoneId.systemDefault());
        String formattedDateTime = formatter.format(appointment.getStartTime());
        context.setVariable(APPOINTMENT_DATETIME, formattedDateTime);

        // Add service name if available
        if (appointment.getService() != null) {
            context.setVariable(SERVICE_NAME, appointment.getService().getName());
        } else {
            context.setVariable(SERVICE_NAME, "Not specified");
        }

        String content = templateEngine.process("mail/appointmentConfirmationEmail", context);
        String subject = messageSource.getMessage("email.appointment.confirmation.title", null, locale);

        sendEmail(user.getEmail(), subject, content, false, true);
    }

    @Async
    public void sendAppointmentCancellationEmail(User user, AppointmentDTO appointment) {
        log.debug("Sending appointment cancellation email to '{}'", user.getEmail());
        if (user.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", user.getLogin());
            return;
        }

        Locale locale = Locale.forLanguageTag(user.getLangKey());
        Context context = new Context(locale);
        context.setVariable(USER, user);
        context.setVariable(APPOINTMENT, appointment);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        // Format the date and time for better readability
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a").withZone(ZoneId.systemDefault());
        String formattedDateTime = formatter.format(appointment.getStartTime());
        context.setVariable(APPOINTMENT_DATETIME, formattedDateTime);

        // Add service name if available
        if (appointment.getService() != null) {
            context.setVariable(SERVICE_NAME, appointment.getService().getName());
        } else {
            context.setVariable(SERVICE_NAME, "Not specified");
        }

        String content = templateEngine.process("mail/appointmentCancellationEmail", context);
        String subject = messageSource.getMessage("email.appointment.cancellation.title", null, locale);

        sendEmail(user.getEmail(), subject, content, false, true);
    }
}
