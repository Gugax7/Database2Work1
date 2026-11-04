package com.mitadasgregas.demo.api;

import com.mitadasgregas.demo.service.MythologyService;
import java.net.URI;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class MythologyController {
    private final MythologyService service;
    public MythologyController(MythologyService service) { this.service = service; }

    @GetMapping("/health") public Map<String, String> health() { service.summary(); return Map.of("status", "ok"); }
    @GetMapping("/summary") public Object summary() { return service.summary(); }
    @GetMapping("/options") public Object options() { return service.options(); }
    @GetMapping("/beings") public Object beings(@RequestParam Map<String, String> filters) { return service.beings(filters); }
    @GetMapping("/beings/{id}") public Object being(@PathVariable long id) { return service.being(id); }
    @GetMapping("/adventures") public Object adventures(@RequestParam Map<String, String> filters) { return service.adventures(filters); }
    @GetMapping("/adventures/{id}") public Object adventure(@PathVariable long id) { return service.adventure(id); }
    @GetMapping("/artifacts") public Object artifacts(@RequestParam Map<String, String> filters) { return service.artifacts(filters); }
    @GetMapping("/artifacts/{id}") public Object artifact(@PathVariable long id) { return service.artifact(id); }
    @PostMapping("/beings") public ResponseEntity<?> createBeing(@RequestBody Requests.Being input) {
        return created("beings", service.createBeing(input));
    }
    @PostMapping("/adventures") public ResponseEntity<?> createAdventure(@RequestBody Requests.Adventure input) {
        return created("adventures", service.createAdventure(input));
    }
    @PostMapping("/artifacts") public ResponseEntity<?> createArtifact(@RequestBody Requests.Artifact input) {
        return created("artifacts", service.createArtifact(input));
    }
    @PostMapping("/beings/{id}/powers") public ResponseEntity<?> power(@PathVariable long id, @RequestBody Requests.PowerLink input) {
        service.addPower(id, input); return ResponseEntity.status(201).body(Map.of("message", "Poder associado."));
    }
    @PostMapping("/beings/{id}/curses") public ResponseEntity<?> curse(@PathVariable long id, @RequestBody Requests.CurseLink input) {
        service.addCurse(id, input); return ResponseEntity.status(201).body(Map.of("message", "Maldição associada."));
    }
    private ResponseEntity<?> created(String resource, long id) {
        return ResponseEntity.created(URI.create("/api/"+resource+"/"+id)).body(Map.of("id", id, "message", "Cadastro realizado com sucesso."));
    }
}
