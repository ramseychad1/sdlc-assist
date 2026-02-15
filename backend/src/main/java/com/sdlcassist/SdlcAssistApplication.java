package com.sdlcassist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SdlcAssistApplication {

    public static void main(String[] args) {
        SpringApplication.run(SdlcAssistApplication.class, args);
    }
}
