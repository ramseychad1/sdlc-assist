package com.sdlcassist.dto;

import lombok.Data;

@Data
public class TechPreferencesRequest {
    private String frontend;
    private String backend;
    private String database;
    private String deployment;
    private String auth;
    private String apiStyle;
}
