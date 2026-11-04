package com.mitadasgregas.demo.api;

import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> domain(ApiException ex) { return error(ex.status(), ex.getMessage()); }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict() {
        return error(409, "Já existe um registro com esse nome ou vínculo, ou os dados violam uma regra do banco.");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> input() {
        return error(400, "Verifique o formato dos campos. IDs e níveis devem ser números; datas usam AAAA-MM-DD.");
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database() {
        return error(503, "Não foi possível consultar o banco agora. Tente novamente em instantes.");
    }

    private ResponseEntity<?> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message, "status", status));
    }
}
