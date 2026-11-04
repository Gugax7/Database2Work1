package com.mitadasgregas.demo.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String origins;
    public WebConfig(@Value("${app.cors-origins:}") String origins) { this.origins = origins; }
    @Override public void addCorsMappings(CorsRegistry registry) {
        if (!origins.isBlank()) registry.addMapping("/api/**")
            .allowedOrigins(origins.split(",")).allowedMethods("GET", "POST").maxAge(3600);
    }
}
