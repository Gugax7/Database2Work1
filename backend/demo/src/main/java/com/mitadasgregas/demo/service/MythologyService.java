package com.mitadasgregas.demo.service;

import com.mitadasgregas.demo.api.ApiException;
import com.mitadasgregas.demo.api.Requests.*;
import com.mitadasgregas.demo.data.MythologyRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MythologyService {
    private final MythologyRepository repo;
    public MythologyService(MythologyRepository repo) { this.repo = repo; }

    public Map<String, Object> summary() { return repo.summary(); }
    public Map<String, Object> options() { return repo.options(); }
    public MythologyRepository.Page beings(Map<String, String> filters) { return repo.beings(filters); }
    public MythologyRepository.Page adventures(Map<String, String> filters) { return repo.adventures(filters); }
    public MythologyRepository.Page artifacts(Map<String, String> filters) { return repo.artifacts(filters); }
    public Map<String, Object> being(long id) { return repo.being(id); }
    public Map<String, Object> adventure(long id) { return repo.adventure(id); }
    public Map<String, Object> artifact(long id) { return repo.artifact(id); }

    @Transactional
    public long createBeing(Being input) {
        required(input, "Preencha os dados do ser.");
        String category = choice(input.category(), "Categoria", "Deus", "Mortal", "Semideus", "Monstro", "Titã");
        String state = choice(input.vitalState(), "Estado vital", "Vivo", "Morto", "Imortal", "Desconhecido");
        long id = repo.insert("ser", fields("Nome", text(input.name(), "Nome", 100, true), "Categoria", category,
            "EstadoVital", state, "Alinhamento", text(input.alignment(), "Alinhamento", 50, false)));
        Attributes a=input.attributes(); required(a, "Preencha os atributos da categoria.");
        switch(category) {
            case "Deus" -> repo.insertLink("deus", fields("ser_id", id,
                "Reino", text(a.realm(), "Reino", 100, false),
                "DominioDivino", text(a.divineDomain(), "Domínio divino", 100, true),
                "Epiteto", text(a.epithet(), "Epíteto", 100, false), "Simbolo", text(a.symbol(), "Símbolo", 100, false)));
            case "Mortal" -> repo.insertLink("mortal", fields("ser_id", id,
                "Ocupacao", text(a.occupation(), "Ocupação", 100, false), "DataNasc", a.birthDate(),
                "CidadeOrigem", text(a.originCity(), "Cidade de origem", 100, false)));
            case "Semideus" -> {
                repo.reference("deus", "ser_id", a.divineParentId(), "Ascendente divino");
                repo.reference("mortal", "ser_id", a.mortalParentId(), "Ascendente mortal");
                repo.insertLink("semideus", fields("ser_id", id, "deus_ser_id", a.divineParentId(),
                    "mortal_ser_id", a.mortalParentId(), "HabilidadeEspecial", text(a.specialAbility(), "Habilidade especial", 10000, false)));
            }
            case "Monstro" -> repo.insertLink("monstro", fields("ser_id", id,
                "RegiaoDeHabitacao", text(a.habitat(), "Habitat", 100, false),
                "GrauDePerigo", range(a.dangerLevel(), "Grau de perigo", 1, 10, false),
                "Categoria", text(a.monsterCategory(), "Categoria de monstro", 50, false)));
            case "Titã" -> repo.insertLink("tita", fields("ser_id", id,
                "Genero", text(a.gender(), "Gênero", 20, false),
                "DominioPrimordial", text(a.primordialDomain(), "Domínio primordial", 100, false),
                "Geracao", range(a.generation(), "Geração", 1, Integer.MAX_VALUE, false)));
            default -> throw new ApiException(400, "Categoria inválida.");
        }
        if (input.hero()!=null) repo.insertLink("heroi", fields("ser_id", id,
            "Motivacao", text(input.hero().motivation(), "Motivação", 10000, false),
            "Mentor", text(input.hero().mentor(), "Mentor", 100, false)));
        if (input.villain()!=null) repo.insertLink("vilao", fields("ser_id", id,
            "ObjetivoMaligno", text(input.villain().objective(), "Objetivo do vilão", 10000, true),
            "NivelAmeaca", range(input.villain().threatLevel(), "Nível de ameaça", 1, 10, false)));
        var powerIds=new HashSet<Long>();
        for (var link : list(input.powers())) {
            required(link, "Poder inválido."); unique(powerIds, link.powerId(), "Poder repetido.");
            power(id, link);
        }
        var curseIds=new HashSet<Long>();
        for (var link : list(input.curses())) {
            required(link, "Maldição inválida."); unique(curseIds, link.curseId(), "Maldição repetida.");
            curse(id, link);
        }
        return id;
    }

    @Transactional
    public long createAdventure(Adventure input) {
        required(input, "Preencha os dados da aventura.");
        repo.reference("local", "id", input.localId(), "Local");
        long id=repo.insert("aventura", fields("Nome", text(input.name(), "Nome", 100, true),
            "AnoInicio", range(input.startYear(), "Ano de início", -100000, 100000, true),
            "Objetivo", text(input.objective(), "Objetivo", 10000, true),
            "Status", choice(input.status(), "Status", "Em Andamento", "Concluida", "Fracassada", "Pendente"),
            "Duracao", text(input.duration(), "Duração", 50, false), "local_id", input.localId()));
        var participants=new HashSet<Long>();
        for (var link : list(input.participants())) {
            required(link, "Participante inválido."); unique(participants, link.beingId(), "Participante repetido.");
            repo.reference("ser", "id", link.beingId(), "Participante");
            repo.insert("ser_aventura", fields("ser_id", link.beingId(), "aventura_id", id, "SerMorreu", flag(link.died())));
        }
        var prophecies=new HashSet<Long>();
        for (var prophecyId : list(input.prophecyIds())) {
            unique(prophecies, prophecyId, "Profecia repetida.");
            repo.reference("profecia", "id", prophecyId, "Profecia");
            repo.insert("profecia_aventura", fields("profecia_id", prophecyId, "aventura_id", id));
        }
        return id;
    }

    @Transactional
    public long createArtifact(Artifact input) {
        required(input, "Preencha os dados do artefato.");
        if (input.materialId()!=null) repo.reference("material", "id", input.materialId(), "Material");
        long id=repo.insert("artefato", fields("Nome", text(input.name(), "Nome", 100, true),
            "material_id", input.materialId(), "PoderEspecial", text(input.specialPower(), "Poder especial", 10000, false),
            "IsAmaldicoado", flag(input.cursed())));
        var types=new HashSet<String>();
        for (var raw : list(input.types())) {
            String type=text(raw, "Tipo", 50, true); unique(types, type, "Tipo repetido.");
            repo.insert("artefato_tipo", fields("artefato_id", id, "Tipo", type));
        }
        var forges=new HashSet<String>();
        for (var forge : list(input.forges())) {
            required(forge, "Forja inválida.");
            repo.reference("material", "id", forge.materialId(), "Material da forja");
            repo.reference("ser", "id", forge.forgerId(), "Forjador");
            unique(forges, forge.materialId()+":"+forge.forgerId(), "Forja repetida.");
            repo.insert("forja", fields("artefato_id", id, "material_id", forge.materialId(), "forjador_ser_id", forge.forgerId()));
        }
        return id;
    }

    @Transactional
    public void addPower(long id, PowerLink link) {
        required(link, "Selecione um poder."); repo.reference("ser", "id", id, "Ser"); power(id, link);
    }
    @Transactional
    public void addCurse(long id, CurseLink link) {
        required(link, "Selecione uma maldição."); repo.reference("ser", "id", id, "Ser"); curse(id, link);
    }
    private void power(long id, PowerLink link) {
        repo.reference("poder", "id", link.powerId(), "Poder");
        repo.insert("poder_ser", fields("ser_id", id, "poder_id", link.powerId(),
            "NivelDominio", range(link.level(), "Nível de domínio", 1, 10, false)));
    }
    private void curse(long id, CurseLink link) {
        repo.reference("maldicao", "id", link.curseId(), "Maldição");
        repo.insert("ser_maldicao", fields("ser_id", id, "maldicao_id", link.curseId(), "FoiQuebrada", flag(link.broken())));
    }

    private static int flag(Boolean value) { return Boolean.TRUE.equals(value) ? 1 : 0; }
    private static void required(Object value, String message) {
        if (value==null) throw new ApiException(400, message);
    }
    private static String text(String value, String label, int max, boolean mandatory) {
        String result=value==null ? null : value.trim();
        if (result==null || result.isEmpty()) {
            if(mandatory) throw new ApiException(400, label+" é obrigatório(a).");
            return null;
        }
        if(result.length()>max) throw new ApiException(400, label+" deve ter até "+max+" caracteres.");
        return result;
    }
    private static String choice(String value, String label, String... allowed) {
        if(value==null || !List.of(allowed).contains(value)) throw new ApiException(400, label+" inválido(a).");
        return value;
    }
    private static Integer range(Integer value, String label, int min, int max, boolean mandatory) {
        if(value==null && !mandatory) return null;
        if(value==null || value<min || value>max) throw new ApiException(400, label+" deve estar entre "+min+" e "+max+".");
        return value;
    }
    private static <T> List<T> list(List<T> input) {
        if(input==null) return List.of();
        if(input.size()>100) throw new ApiException(400, "Adicione no máximo 100 vínculos por cadastro.");
        return input;
    }
    private static <T> void unique(Set<T> seen, T value, String message) {
        if(value==null || !seen.add(value)) throw new ApiException(400, message);
    }
    private static LinkedHashMap<String, Object> fields(Object... pairs) {
        var result=new LinkedHashMap<String, Object>();
        for(int i=0; i<pairs.length; i+=2) result.put((String)pairs[i], pairs[i+1]);
        return result;
    }
}
