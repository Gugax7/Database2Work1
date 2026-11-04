package com.mitadasgregas.demo.api;

public class ApiException extends RuntimeException {
    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }
    public int status() { return status; }
}
