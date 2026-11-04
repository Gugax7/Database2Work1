package com.mitadasgregas.demo;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.regex.Pattern;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.junit.jupiter.api.Assertions.*;

/** Real HTTP + PostgreSQL tests. No fallback to DATABASE_URL or the shared Neon. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "logging.level.root=WARN", "spring.main.banner-mode=off", "spring.devtools.add-properties=false"
})
@EnabledIfEnvironmentVariable(named = "TEST_DATABASE_URL", matches = ".+")
class DemoApplicationTests {
    @LocalServerPort int port;
    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @DynamicPropertySource
    static void localOnly(DynamicPropertyRegistry registry) {
        String url=System.getenv("TEST_DATABASE_URL");
        if (url==null || !url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1|test-db):[0-9]+/mythology_test"))
            throw new IllegalStateException("Tests require a dedicated LOCAL mythology_test database.");
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> System.getenv().getOrDefault("TEST_DATABASE_USER", "mythology_test"));
        registry.add("spring.datasource.password", () -> System.getenv().getOrDefault("TEST_DATABASE_PASSWORD", "local_test_only"));
    }
    @BeforeEach void fixture() {
        new ResourceDatabasePopulator(new ClassPathResource("schema.sql")).execute(dataSource);
        jdbc.execute("TRUNCATE ser, deus, mortal, semideus, heroi, vilao, monstro, tita, poder, poder_ser, poder_tipo, maldicao, ser_maldicao, metamorfose, aventura, ser_aventura, local, batalha, batalha_ser, oraculo, profecia, profecia_aventura, profecia_ser, artefato, artefato_tipo, forja, material RESTART IDENTITY CASCADE");
        new ResourceDatabasePopulator(new ClassPathResource("seed.sql")).execute(dataSource);
    }
    private HttpResponse<String> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api"+path)).timeout(Duration.ofSeconds(15)).build(), HttpResponse.BodyHandlers.ofString());
    }
    private HttpResponse<String> post(String path, String json) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api"+path)).timeout(Duration.ofSeconds(15)).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.ofString());
    }
    private long id(HttpResponse<String> result) {
        assertEquals(201,result.statusCode(),result.body());
        var match=Pattern.compile("\"id\":(\\d+)").matcher(result.body()); assertTrue(match.find()); return Long.parseLong(match.group(1));
    }
    @Test void contextLoads() { assertNotNull(dataSource); }
    @Test void countsAndOptionsAreReal() throws Exception {
        var result=get("/summary"); assertEquals(200,result.statusCode()); assertTrue(result.body().contains("\"beings\":5"));
        var options=get("/options"); assertEquals(200,options.statusCode()); assertTrue(options.body().contains("Deusa Teste"));
    }
    @Test void combinedMonsterFiltersAndRole() throws Exception {
        var result=get("/beings?category=Monstro&role=villain&powerId=1&minDanger=8&monsterCategory=H%C3%ADbrido&vitalState=Morto&alignment=Maligno&q=Monstro");
        assertEquals(200,result.statusCode()); assertTrue(result.body().contains("Monstro Teste")); assertTrue(result.body().contains("\"total\":1"));
        assertTrue(get("/beings?powerId=2&minDanger=8").body().contains("\"total\":0"));
    }
    @Test void ancestryIsSeparateFromHeroRole() throws Exception {
        var result=get("/beings?divineParentId=1&role=hero&category=Semideus");
        assertEquals(200,result.statusCode()); assertTrue(result.body().contains("Herói Teste"));
        var detail=get("/beings/3"); assertTrue(detail.body().contains("Deusa Teste")); assertTrue(detail.body().contains("Mortal Teste"));
    }
    @Test void preservesRecordsWithoutLinksAndReturns404() throws Exception {
        var being=get("/beings/5"); assertEquals(200,being.statusCode()); assertTrue(being.body().contains("\"powers\":[]"));
        var adventure=get("/adventures/2"); assertEquals(200,adventure.statusCode()); assertTrue(adventure.body().contains("\"participants\":[]"));
        var artifact=get("/artifacts/2"); assertEquals(200,artifact.statusCode()); assertTrue(artifact.body().contains("\"forges\":[]"));
        assertEquals(404,get("/beings/99999").statusCode());
    }
    @Test void adventureFiltersUseSameProphecyAndDoNotDuplicate() throws Exception {
        var result=get("/adventures?beingId=3&localId=1&yearFrom=-1250&yearTo=-1150&oracleId=1&prophecyState=Cumprida&status=Concluida&q=poder");
        assertEquals(200,result.statusCode()); assertTrue(result.body().contains("\"total\":1"));
        assertTrue(get("/adventures?oracleId=1&prophecyState=Pendente").body().contains("\"total\":0"));
        var detail=get("/adventures/1"); assertTrue(detail.body().contains("\"died\":true")); assertTrue(detail.body().contains("Oráculo Teste"));
    }
    @Test void artifactFiltersUseSameForgeAndDoNotDuplicate() throws Exception {
        var result=get("/artifacts?type=Arma&materialId=1&forgerId=1&cursed=true&q=Teste");
        assertEquals(200,result.statusCode()); assertTrue(result.body().contains("\"total\":1"));
        assertTrue(get("/artifacts?materialId=2&forgerId=1").body().contains("\"total\":0"));
    }
    @Test void paginationAndSqlInjectionAreSafe() throws Exception {
        assertTrue(get("/beings?size=2&page=1").body().contains("\"total\":5"));
        var injection=get("/beings?q=%27%20OR%201%3D1%20--"); assertEquals(200,injection.statusCode()); assertTrue(injection.body().contains("\"total\":0"));
        assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM ser",Integer.class));
    }
    @Test void rejectsBadFilters() throws Exception {
        for(String path:new String[]{"/beings?page=-1","/beings?size=101","/beings?minDanger=11","/beings?powerId=no","/beings?role=unknown","/adventures?yearFrom=1&yearTo=-1","/artifacts?cursed=yes","/artifacts?unknown=1"})
            assertEquals(400,get(path).statusCode(),path);
    }
    @Test void createsBeingWithSubtypeRolesAndConnections() throws Exception {
        long created=id(post("/beings","""
            {"name":"Novo Semideus","category":"Semideus","vitalState":"Vivo","alignment":"Bom",
             "attributes":{"divineParentId":1,"mortalParentId":2,"specialAbility":"Coragem"},
             "hero":{"motivation":"Proteger","mentor":"Atena"},"villain":{"objective":"Dominar","threatLevel":2},
             "powers":[{"powerId":1,"level":8}],"curses":[{"curseId":1,"broken":false}]}
            """));
        var detail=get("/beings/"+created); assertEquals(200,detail.statusCode()); assertTrue(detail.body().contains("Coragem"));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM heroi WHERE ser_id=?",Integer.class,created));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM vilao WHERE ser_id=?",Integer.class,created));
    }
    @Test void createsOtherCategoriesWithoutChangingExistingRows() throws Exception {
        for(String body:new String[]{
            "{\"name\":\"Nova Deusa\",\"category\":\"Deus\",\"vitalState\":\"Imortal\",\"attributes\":{\"divineDomain\":\"Mar\"}}",
            "{\"name\":\"Novo Mortal\",\"category\":\"Mortal\",\"vitalState\":\"Vivo\",\"attributes\":{\"birthDate\":\"1234-01-01\"}}",
            "{\"name\":\"Novo Monstro\",\"category\":\"Monstro\",\"vitalState\":\"Vivo\",\"attributes\":{\"dangerLevel\":10}}",
            "{\"name\":\"Novo Titã\",\"category\":\"Titã\",\"vitalState\":\"Imortal\",\"attributes\":{\"generation\":2}}"}) id(post("/beings",body));
        assertEquals("Deusa Teste",jdbc.queryForObject("SELECT \"Nome\" FROM ser WHERE id=1",String.class));
    }
    @Test void rollsBackBeingWhenLateReferenceFails() throws Exception {
        var result=post("/beings","""
            {"name":"Não Persistir","category":"Mortal","vitalState":"Vivo","attributes":{},
             "powers":[{"powerId":1,"level":5}],"curses":[{"curseId":999,"broken":false}]}
            """);
        assertEquals(400,result.statusCode());
        assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM ser",Integer.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM poder_ser",Integer.class));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM mortal",Integer.class));
    }
    @Test void createsAdventureWithParticipantsAndProphecy() throws Exception {
        long created=id(post("/adventures","""
            {"name":"Nova Jornada","startYear":-1000,"objective":"Explorar","status":"Pendente","localId":1,
             "participants":[{"beingId":3,"died":false},{"beingId":4,"died":true}],"prophecyIds":[1]}
            """));
        var detail=get("/adventures/"+created); assertTrue(detail.body().contains("Herói Teste")); assertTrue(detail.body().contains("A jornada terá um fim"));
        assertEquals(400,post("/adventures","{\"name\":\"Reverter Jornada\",\"startYear\":-1,\"objective\":\"Explorar\",\"status\":\"Pendente\",\"localId\":1,\"participants\":[{\"beingId\":999}]}").statusCode());
        assertEquals(3,jdbc.queryForObject("SELECT COUNT(*) FROM aventura",Integer.class));
    }
    @Test void createsArtifactAndRollsBackInvalidForge() throws Exception {
        long created=id(post("/artifacts","""
            {"name":"Nova Relíquia","materialId":1,"specialPower":"Brilho","cursed":false,
             "types":["Arma","Relíquia"],"forges":[{"materialId":2,"forgerId":1}]}
            """));
        assertTrue(get("/artifacts/"+created).body().contains("Deusa Teste"));
        assertEquals(400,post("/artifacts","{\"name\":\"Reverter Artefato\",\"types\":[\"Arma\"],\"forges\":[{\"materialId\":1,\"forgerId\":999}]}").statusCode());
        assertEquals(3,jdbc.queryForObject("SELECT COUNT(*) FROM artefato",Integer.class));
        assertEquals(4,jdbc.queryForObject("SELECT COUNT(*) FROM artefato_tipo",Integer.class));
    }
    @Test void associatesAndRejectsDuplicateLinks() throws Exception {
        assertEquals(201,post("/beings/5/powers","{\"powerId\":1,\"level\":7}").statusCode());
        assertEquals(409,post("/beings/5/powers","{\"powerId\":1,\"level\":7}").statusCode());
        assertEquals(201,post("/beings/5/curses","{\"curseId\":1,\"broken\":true}").statusCode());
        assertEquals(409,post("/beings/5/curses","{\"curseId\":1}").statusCode());
        assertEquals(400,post("/beings/5/powers","{\"powerId\":2,\"level\":11}").statusCode());
    }
    @Test void rejectsInvalidAndDuplicateEntriesWithoutLeakingSql() throws Exception {
        assertEquals(400,post("/beings","{\"name\":\"Inválido\",\"category\":\"Deus\",\"vitalState\":\"Imortal\",\"attributes\":{}}").statusCode());
        assertEquals(400,post("/beings","{\"name\":\"Pais Inválidos\",\"category\":\"Semideus\",\"vitalState\":\"Vivo\",\"attributes\":{\"divineParentId\":2,\"mortalParentId\":1}}").statusCode());
        assertEquals(400,post("/beings","{bad json}").statusCode());
        assertEquals(400,post("/artifacts","{\"name\":\"Tipos Repetidos\",\"types\":[\"Arma\",\"Arma\"]}").statusCode());
        var duplicate=post("/artifacts","{\"name\":\"Artefato Teste\"}"); assertEquals(409,duplicate.statusCode()); assertFalse(duplicate.body().contains("INSERT"));
        assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM ser",Integer.class));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM artefato",Integer.class));
    }
}
