package com.mitadasgregas.demo.data;

import com.mitadasgregas.demo.api.ApiException;
import java.util.*;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** All SQL identifiers are constants owned by the application; values are bound parameters. */
@Repository
public class MythologyRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public MythologyRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Page(List<Map<String, Object>> items, long total, int page, int size) {}

    public List<Map<String, Object>> query(String sql, Map<String, ?> params) {
        return jdbc.queryForList(sql, params);
    }
    public List<Map<String, Object>> query(String sql) { return query(sql, Map.of()); }
    public Map<String, Object> one(String sql, long id) {
        var rows = query(sql, Map.of("id", id));
        if (rows.isEmpty()) throw new ApiException(404, "Registro não encontrado.");
        return rows.getFirst();
    }

    public Map<String, Object> summary() {
        return query("""
            SELECT (SELECT COUNT(*) FROM ser) AS beings,
              (SELECT COUNT(*) FROM aventura) AS adventures,
              (SELECT COUNT(*) FROM artefato) AS artifacts,
              (SELECT COUNT(*) FROM local) AS places,
              (SELECT COUNT(*) FROM profecia) AS prophecies
            """).getFirst();
    }

    public Map<String, Object> options() {
        var result = new LinkedHashMap<String, Object>();
        result.put("beings", query("SELECT id, \"Nome\" AS name, \"Categoria\" AS category FROM ser ORDER BY \"Nome\""));
        result.put("gods", query("SELECT s.id, s.\"Nome\" AS name FROM ser s JOIN deus d ON d.ser_id=s.id ORDER BY s.\"Nome\""));
        result.put("mortals", query("SELECT s.id, s.\"Nome\" AS name FROM ser s JOIN mortal m ON m.ser_id=s.id ORDER BY s.\"Nome\""));
        result.put("places", query("SELECT id, \"Nome\" AS name, \"RegiaoGeografica\" AS region FROM local ORDER BY \"Nome\""));
        result.put("materials", query("SELECT id, \"Nome\" AS name FROM material ORDER BY \"Nome\""));
        result.put("powers", query("SELECT id, \"Nome\" AS name FROM poder ORDER BY \"Nome\""));
        result.put("curses", query("SELECT id, \"Nome\" AS name FROM maldicao ORDER BY \"Nome\""));
        result.put("oracles", query("SELECT id, \"Nome\" AS name FROM oraculo ORDER BY \"Nome\""));
        result.put("prophecies", query("SELECT id, \"DescricaoCurta\" AS name FROM profecia ORDER BY id"));
        result.put("artifactTypes", query("SELECT DISTINCT \"Tipo\" AS name FROM artefato_tipo ORDER BY \"Tipo\""));
        result.put("alignments", query("SELECT DISTINCT \"Alinhamento\" AS name FROM ser WHERE \"Alinhamento\" IS NOT NULL ORDER BY \"Alinhamento\""));
        result.put("monsterCategories", query("SELECT DISTINCT \"Categoria\" AS name FROM monstro WHERE \"Categoria\" IS NOT NULL ORDER BY \"Categoria\""));
        return result;
    }

    private static class Search {
        final StringBuilder where = new StringBuilder(" WHERE TRUE");
        final Map<String, Object> values = new HashMap<>();
        final Map<String, String> filters;
        Search(Map<String, String> filters, String... allowed) {
            this.filters = filters;
            var keys = new HashSet<>(List.of(allowed));
            keys.addAll(List.of("page", "size"));
            for (var key : filters.keySet()) if (!keys.contains(key))
                throw new ApiException(400, "Filtro desconhecido: " + key);
            if (filters.values().stream().anyMatch(v -> v.length() > 200))
                throw new ApiException(400, "Os filtros devem ter até 200 caracteres.");
        }
        String value(String key) { return filters.getOrDefault(key, "").trim(); }
        void text(String key, String expression) {
            if (!value(key).isEmpty()) {
                where.append(" AND (").append(expression).append(")");
                values.put(key, value(key));
            }
        }
        void number(String key, String expression, int min, int max) {
            if (!value(key).isEmpty()) {
                int n = integer(value(key), key);
                if (n < min || n > max) throw new ApiException(400, "Valor inválido para " + key + ".");
                where.append(" AND (").append(expression).append(")"); values.put(key, n);
            }
        }
        void bool(String key, String expression) {
            if (!value(key).isEmpty()) {
                if (!List.of("true", "false").contains(value(key)))
                    throw new ApiException(400, "Valor inválido para " + key + ".");
                where.append(" AND (").append(expression).append(")");
                values.put(key, value(key).equals("true") ? 1 : 0);
            }
        }
    }
    private static int integer(String raw, String label) {
        try { return Integer.parseInt(raw); }
        catch (NumberFormatException ex) { throw new ApiException(400, "Informe um número válido para " + label + "."); }
    }
    private Page page(String select, String from, Search search, String order) {
        int page = integer(search.filters.getOrDefault("page", "0"), "página");
        int size = integer(search.filters.getOrDefault("size", "12"), "tamanho da página");
        if (page < 0 || page > 100000 || size < 1 || size > 100)
            throw new ApiException(400, "Paginação inválida: página a partir de 0 e tamanho entre 1 e 100.");
        String tail = from + search.where;
        Long total = jdbc.queryForObject("SELECT COUNT(*) " + tail, search.values, Long.class);
        search.values.put("limit", size); search.values.put("offset", (long) page * size);
        return new Page(query(select + tail + " ORDER BY " + order + " LIMIT :limit OFFSET :offset", search.values), total, page, size);
    }

    public Page beings(Map<String, String> filters) {
        var s = new Search(filters, "q", "category", "role", "vitalState", "alignment", "powerId", "minDanger", "monsterCategory", "divineParentId");
        s.text("q", "s.\"Nome\" ILIKE '%' || :q || '%'");
        s.text("category", "s.\"Categoria\"=:category");
        s.text("vitalState", "s.\"EstadoVital\"=:vitalState");
        s.text("alignment", "s.\"Alinhamento\"=:alignment");
        if (!s.value("role").isEmpty()) {
            if (!List.of("hero", "villain").contains(s.value("role"))) throw new ApiException(400, "Papel inválido.");
            s.where.append(s.value("role").equals("hero") ? " AND EXISTS (SELECT 1 FROM heroi h WHERE h.ser_id=s.id)" : " AND EXISTS (SELECT 1 FROM vilao v WHERE v.ser_id=s.id)");
        }
        s.number("powerId", "EXISTS (SELECT 1 FROM poder_ser ps JOIN poder p ON p.id=ps.poder_id WHERE ps.ser_id=s.id AND p.id=:powerId)", 1, Integer.MAX_VALUE);
        s.number("minDanger", "m.\"GrauDePerigo\">=:minDanger", 1, 10);
        s.text("monsterCategory", "m.\"Categoria\"=:monsterCategory");
        s.number("divineParentId", "EXISTS (SELECT 1 FROM semideus sd JOIN deus d ON d.ser_id=sd.deus_ser_id WHERE sd.ser_id=s.id AND d.ser_id=:divineParentId)", 1, Integer.MAX_VALUE);
        return page("""
            SELECT s.id, s."Nome" AS name, s."Categoria" AS category,
              s."EstadoVital" AS "vitalState", s."Alinhamento" AS alignment,
              m."GrauDePerigo" AS "dangerLevel", d."DominioDivino" AS domain,
              EXISTS(SELECT 1 FROM heroi h WHERE h.ser_id=s.id) AS hero,
              EXISTS(SELECT 1 FROM vilao v WHERE v.ser_id=s.id) AS villain
            """, " FROM ser s LEFT JOIN monstro m ON m.ser_id=s.id LEFT JOIN deus d ON d.ser_id=s.id", s, "s.\"Nome\", s.id");
    }

    public Page adventures(Map<String, String> filters) {
        var s = new Search(filters, "q", "status", "localId", "beingId", "yearFrom", "yearTo", "oracleId", "prophecyState");
        s.text("q", "a.\"Nome\" ILIKE '%' || :q || '%' OR a.\"Objetivo\" ILIKE '%' || :q || '%'");
        s.text("status", "a.\"Status\"=:status");
        s.number("localId", "a.local_id=:localId", 1, Integer.MAX_VALUE);
        s.number("beingId", "EXISTS (SELECT 1 FROM ser_aventura sa JOIN ser sr ON sr.id=sa.ser_id WHERE sa.aventura_id=a.id AND sr.id=:beingId)", 1, Integer.MAX_VALUE);
        s.number("yearFrom", "a.\"AnoInicio\">=:yearFrom", -100000, 100000);
        s.number("yearTo", "a.\"AnoInicio\"<=:yearTo", -100000, 100000);
        if (s.values.containsKey("yearFrom") && s.values.containsKey("yearTo") && (int)s.values.get("yearFrom") > (int)s.values.get("yearTo"))
            throw new ApiException(400, "O ano inicial deve ser menor ou igual ao ano final.");
        // Both conditions refer to the SAME prophecy, rather than unrelated associations.
        if (!s.value("oracleId").isEmpty() || !s.value("prophecyState").isEmpty()) {
            s.where.append(" AND EXISTS (SELECT 1 FROM profecia_aventura pa JOIN profecia p ON p.id=pa.profecia_id JOIN oraculo o ON o.id=p.oraculo_id WHERE pa.aventura_id=a.id");
            if (!s.value("oracleId").isEmpty()) {
                int id=integer(s.value("oracleId"), "oráculo");
                if(id<1) throw new ApiException(400, "Oráculo inválido.");
                s.where.append(" AND o.id=:oracleId"); s.values.put("oracleId", id);
            }
            if (!s.value("prophecyState").isEmpty()) {
                s.where.append(" AND p.\"Estado\"=:prophecyState"); s.values.put("prophecyState", s.value("prophecyState"));
            }
            s.where.append(")");
        }
        return page("""
            SELECT a.id, a."Nome" AS name, a."AnoInicio" AS "startYear", a."Objetivo" AS objective,
              a."Status" AS status, a."Duracao" AS duration, l.id AS "localId", l."Nome" AS "localName",
              (SELECT COUNT(*) FROM ser_aventura sa WHERE sa.aventura_id=a.id) AS "participantCount"
            """, " FROM aventura a LEFT JOIN local l ON l.id=a.local_id", s, "a.\"AnoInicio\", a.id");
    }

    public Page artifacts(Map<String, String> filters) {
        var s = new Search(filters, "q", "materialId", "type", "cursed", "forgerId");
        s.text("q", "a.\"Nome\" ILIKE '%' || :q || '%'");
        s.bool("cursed", "a.\"IsAmaldicoado\"=:cursed");
        s.text("type", "EXISTS (SELECT 1 FROM artefato_tipo t WHERE t.artefato_id=a.id AND t.\"Tipo\"=:type)");
        // With a forger selected, material must be part of that same forge record.
        if (!s.value("forgerId").isEmpty()) {
            s.number("forgerId", "EXISTS (SELECT 1 FROM forja f JOIN ser sr ON sr.id=f.forjador_ser_id WHERE f.artefato_id=a.id AND sr.id=:forgerId" + (s.value("materialId").isEmpty() ? "" : " AND f.material_id=:materialId") + ")", 1, Integer.MAX_VALUE);
            if (!s.value("materialId").isEmpty()) {
                int id=integer(s.value("materialId"), "material");
                if(id<1) throw new ApiException(400, "Material inválido.");
                s.values.put("materialId", id);
            }
        } else s.number("materialId", "a.material_id=:materialId OR EXISTS (SELECT 1 FROM forja f WHERE f.artefato_id=a.id AND f.material_id=:materialId)", 1, Integer.MAX_VALUE);
        return page("""
            SELECT a.id, a."Nome" AS name, a."PoderEspecial" AS "specialPower",
              (a."IsAmaldicoado"<>0) AS cursed, m."Nome" AS "materialName"
            """, " FROM artefato a LEFT JOIN material m ON m.id=a.material_id", s, "a.\"Nome\", a.id");
    }

    public Map<String, Object> being(long id) {
        var result = new LinkedHashMap<>(one("""
            SELECT s.id, s."Nome" AS name, s."Categoria" AS category, s."EstadoVital" AS "vitalState",
              s."Alinhamento" AS alignment FROM ser s WHERE s.id=:id
            """, id));
        String table = switch ((String) result.get("category")) {
            case "Deus" -> "deus"; case "Mortal" -> "mortal"; case "Semideus" -> "semideus";
            case "Monstro" -> "monstro"; case "Titã" -> "tita"; default -> null;
        };
        result.put("attributes", table == null ? List.of() : query("SELECT * FROM " + table + " WHERE ser_id=:id", Map.of("id", id)));
        result.put("hero", query("SELECT \"Motivacao\" AS motivation, \"Mentor\" AS mentor FROM heroi WHERE ser_id=:id", Map.of("id", id)));
        result.put("villain", query("SELECT \"ObjetivoMaligno\" AS objective, \"NivelAmeaca\" AS \"threatLevel\" FROM vilao WHERE ser_id=:id", Map.of("id", id)));
        result.put("parents", query("""
            SELECT d.id, d."Nome" AS name, 'Divina' AS kind FROM semideus sd JOIN ser d ON d.id=sd.deus_ser_id WHERE sd.ser_id=:id
            UNION ALL
            SELECT m.id, m."Nome" AS name, 'Mortal' AS kind FROM semideus sd JOIN ser m ON m.id=sd.mortal_ser_id WHERE sd.ser_id=:id
            """, Map.of("id", id)));
        result.put("powers", query("""
            SELECT p.id, p."Nome" AS name, p."Intensidade" AS intensity, p."Origem" AS origin, ps."NivelDominio" AS level
            FROM poder_ser ps JOIN poder p ON p.id=ps.poder_id WHERE ps.ser_id=:id ORDER BY p."Nome"
            """, Map.of("id", id)));
        result.put("curses", query("""
            SELECT m.id, m."Nome" AS name, m."Severidade" AS severity, m."DeusQueLancou" AS caster,
              m."CondicaoEncerramento" AS ending, (sm."FoiQuebrada"<>0) AS broken
            FROM ser_maldicao sm JOIN maldicao m ON m.id=sm.maldicao_id WHERE sm.ser_id=:id ORDER BY m."Nome"
            """, Map.of("id", id)));
        result.put("metamorphoses", query("""
            SELECT "FormaAssumida" AS form, "Motivo" AS reason, ("IsReversivel"<>0) AS reversible, "ContextoMitico" AS context
            FROM metamorfose WHERE ser_id=:id ORDER BY id
            """, Map.of("id", id)));
        result.put("adventures", query("""
            SELECT a.id, a."Nome" AS name, a."Status" AS status, (sa."SerMorreu"<>0) AS died
            FROM ser_aventura sa JOIN aventura a ON a.id=sa.aventura_id WHERE sa.ser_id=:id ORDER BY a."AnoInicio"
            """, Map.of("id", id)));
        result.put("battles", query("""
            SELECT b.id, b."NomeBatalha" AS name, b."ResultadoGeral" AS result, b.aventura_id AS "adventureId", a."Nome" AS "adventureName"
            FROM batalha_ser bs JOIN batalha b ON b.id=bs.batalha_id LEFT JOIN aventura a ON a.id=b.aventura_id
            WHERE bs.ser_id=:id ORDER BY b.id
            """, Map.of("id", id)));
        return result;
    }

    public Map<String, Object> adventure(long id) {
        var result = new LinkedHashMap<>(one("""
            SELECT a.id, a."Nome" AS name, a."AnoInicio" AS "startYear", a."Objetivo" AS objective,
              a."Status" AS status, a."Duracao" AS duration, l."Nome" AS "localName",
              l."RegiaoGeografica" AS region, l."Tipo" AS "localType", l."DeusPertencente" AS "localDeity"
            FROM aventura a LEFT JOIN local l ON l.id=a.local_id WHERE a.id=:id
            """, id));
        result.put("participants", query("""
            SELECT s.id, s."Nome" AS name, s."Categoria" AS category, (sa."SerMorreu"<>0) AS died
            FROM ser_aventura sa JOIN ser s ON s.id=sa.ser_id WHERE sa.aventura_id=:id ORDER BY s."Nome"
            """, Map.of("id", id)));
        result.put("battles", query("""
            SELECT b.id, b."NomeBatalha" AS name, b."ResultadoGeral" AS result,
              CAST(b."DataInicio" AS text) AS "startDate", CAST(b."DataFim" AS text) AS "endDate"
            FROM batalha b WHERE b.aventura_id=:id ORDER BY b."DataInicio", b.id
            """, Map.of("id", id)));
        result.put("prophecies", query("""
            SELECT p.id, p."DescricaoCurta" AS description, p."Estado" AS state,
              CAST(p."DataEnunciado" AS text) AS date, o."Nome" AS oracle, o."MetodoConsulta" AS method
            FROM profecia_aventura pa JOIN profecia p ON p.id=pa.profecia_id LEFT JOIN oraculo o ON o.id=p.oraculo_id
            WHERE pa.aventura_id=:id ORDER BY p.id
            """, Map.of("id", id)));
        return result;
    }

    public Map<String, Object> artifact(long id) {
        var result = new LinkedHashMap<>(one("""
            SELECT a.id, a."Nome" AS name, a."PoderEspecial" AS "specialPower", (a."IsAmaldicoado"<>0) AS cursed,
              m."Nome" AS "materialName", m."OrigemMitica" AS "materialOrigin", m."Dureza" AS hardness,
              m."CaracteristicaEspecial" AS "materialFeature"
            FROM artefato a LEFT JOIN material m ON m.id=a.material_id WHERE a.id=:id
            """, id));
        result.put("types", query("SELECT \"Tipo\" AS name FROM artefato_tipo WHERE artefato_id=:id ORDER BY \"Tipo\"", Map.of("id", id)));
        result.put("forges", query("""
            SELECT f.id, m."Nome" AS material, s.id AS "forgerId", s."Nome" AS forger
            FROM forja f LEFT JOIN material m ON m.id=f.material_id LEFT JOIN ser s ON s.id=f.forjador_ser_id
            WHERE f.artefato_id=:id ORDER BY f.id
            """, Map.of("id", id)));
        return result;
    }

    public void reference(String table, String key, Long id, String label) {
        if (id == null || id < 1 || query("SELECT " + key + " FROM " + table + " WHERE " + key + "=:id FOR KEY SHARE", Map.of("id", id)).isEmpty())
            throw new ApiException(400, label + " não encontrado(a). Selecione um registro existente.");
    }
    public long insert(String table, LinkedHashMap<String, Object> fields) {
        String sql=insertSql(table, fields) + " RETURNING id";
        return Objects.requireNonNull(jdbc.queryForObject(sql, fields, Long.class));
    }
    public void insertLink(String table, LinkedHashMap<String, Object> fields) {
        jdbc.update(insertSql(table, fields), new MapSqlParameterSource(fields));
    }
    private String insertSql(String table, LinkedHashMap<String, Object> fields) {
        return "INSERT INTO " + table + " (" + String.join(",", fields.keySet().stream().map(k -> "\"" + k + "\"").toList()) + ") VALUES (" +
            String.join(",", fields.keySet().stream().map(k -> ":" + k).toList()) + ")";
    }
}
