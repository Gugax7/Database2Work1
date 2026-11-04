# Mythos — Greek Mythology Encyclopedia

A Database II project built on the original Database I model. Explore beings, adventures, and artifacts, follow their relationships, and add new records through a Portuguese-language interface.

## Academic context

- **Course:** Banco de Dados II (EMA981915-COMP-NOT), UNESP
- **Professor:** Leonardo Tortoro Pereira
- **Group:**
  - Gustavo Henrique Abelio Pinheiro
  - Gustavo Salmazo da Silva
  - Henrique Luiz Muniz Silva
  - João Carlos Proença Neto
  - Maria Fernanda Perez
  - Pietro Ferreira Franca

**Stack:** Java 21, Spring Boot, explicit SQL with JDBC, React/TypeScript, PostgreSQL on Neon, and Docker Compose.

## Run with Docker Compose

Requirements: Docker Engine and Compose v2. On WSL, enable your distribution's integration in Docker Desktop.

1. Create `backend/demo/.env` and `frontend/.env` from the corresponding `.env.example` files, then configure them for your environment.
2. Configure the backend with `DATABASE_URL` (a **JDBC** URL with `sslmode=require` for Neon), `DATABASE_USER`, and `DATABASE_PASSWORD`.
3. From the repository root, run:

```bash
docker compose up --build
```

Open **http://localhost:3000**. The API is available at **http://localhost:8080/api**; `/api/health` checks database access.

The frontend uses `/api`, which Vite proxies to the backend service. `VITE_API_URL`, if set, is public and must point to the HTTP API. Database credentials belong exclusively in the backend.

React changes reload through Vite. Java rebuilds clean previous bytecode so deleted source files cannot leave stale classes active. Backend source changes are checked every two seconds, compiled inside the container, and picked up by DevTools after successful compilation. Changes to `pom.xml`, dependencies, or Dockerfiles require rebuilding.

Development containers use UID/GID 1000 by default, configurable through `LOCAL_UID` and `LOCAL_GID`. Backend source and `pom.xml` are mounted read-only; build output and caches stay inside the container. The frontend uses `/app` consistently, with a separate `node_modules` volume.

The main Compose configuration connects to the configured Neon database without automatic schema initialization or migrations.

## Features

- **Home:** search across beings, adventures, and artifacts; real API counts; featured heroes.
- **Beings:** combine name, category, hero/villain role, vital state, alignment, power, monster danger/type, and divine ancestry filters.
- **Being details:** category attributes, roles, demigod parents, powers, curses, transformations, adventures, and battles. Associate existing powers and curses.
- **Adventures:** filter by name/objective, status, location, participant, year range, oracle, and prophecy state. Details include participants, recorded deaths, battles, and prophecies.
- **Artifacts:** filter by name, material, type, cursed status, and forger. View material properties and forge records.
- **Registration:** create beings in five categories with optional roles, adventures with participants/prophecies, and artifacts with types/forges. Forms support multiple relationships, named selectors, validation, and transactional writes.

The interface is responsive and keyboard-accessible, with pagination, URL-preserved filters, loading indicators, empty states, and success/error feedback. Authentication, deletion, graphs, and advanced dashboards are outside this scope.

## Preserving the Database I model

`mitologia.sql` is unchanged. Application startup does not execute it or create/alter database objects. Hibernate uses `ddl-auto=none`, and SQL initialization is disabled. Write endpoints insert only the records explicitly submitted by the user; they do not update or delete existing records.

**Do not execute `mitologia.sql` against the shared Neon database: it contains `DROP TABLE`.** Automated write tests use dedicated local PostgreSQL databases.

The application adapts to the original schema:

- Mixed-case column names are quoted in SQL. API field names do not rename database columns.
- `heroi` and `vilao` are additional roles, independent of the five being categories, and may coexist.
- Demigod parents are validated against `deus.ser_id` and `mortal.ser_id`, rather than accepting arbitrary beings.
- `SMALLINT` flags are exposed as booleans and inserted as 0/1 without changing column types.
- `Mentor`, `DeusPertencente`, and `DeusQueLancou` remain text. Matching names do not create inferred relationships.
- The artifact's main material and materials recorded in its forges are distinct. A combined material/forger filter must match the same forge record.
- Forge records identify forgers, not owners. Missing relationships are shown as empty states.
- Dates are displayed as recorded. Negative adventure years are shown as BC; positive dates are not silently reinterpreted as BC.

The original script declares no foreign keys. References are checked within transactions using `FOR KEY SHARE`, repeated form links are rejected, and existing uniqueness constraints handle duplicate names/relationships. A late failure rolls back the operation's inserts. PostgreSQL sequences may still advance during rolled-back transactions, leaving normal gaps in IDs.

These checks protect application operations but do not replace foreign keys for writes made through other tools. Application limits are 10,000 characters for free text, 100 relationships per submission, and adventure years from -100,000 to 100,000.

## Project structure

```text
backend/demo/src/main/java/com/mitadasgregas/demo/
  DemoApplication.java              # Application entry point
  api/                              # Routes, request contracts, errors, CORS
  service/MythologyService.java      # Validation and transactions
  data/MythologyRepository.java     # Parameterized SQL, joins, pagination
frontend/src/
  App.tsx                           # Home, filters, lists, navigation
  Details.tsx                       # Details and relationship forms
  Register.tsx                      # Registration and multiple relationships
  api.ts / hooks.ts / ui.tsx        # HTTP, loading state, shared components
mitologia.sql                        # Database I schema and initial data
docker-compose.yml                   # Development services
compose.test.yml                     # Isolated PostgreSQL integration tests
compose.production.yml               # Production services
.github/workflows/checks.yml         # GitHub Actions backend/frontend checks
```

`DemoApplicationTests` exercises real HTTP and PostgreSQL against a dedicated local test database. JPA/Hibernate dependencies remain from the initial Spring Boot setup, but Hibernate schema management is disabled with `ddl-auto=none`; application queries use `NamedParameterJdbcTemplate` rather than JPA repositories.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health`, `/api/summary`, `/api/options` | Health, counts, form options |
| GET | `/api/beings`, `/api/adventures`, `/api/artifacts` | Paginated searches |
| GET | `/api/beings/{id}`, `/api/adventures/{id}`, `/api/artifacts/{id}` | Related details |
| POST | `/api/beings`, `/api/adventures`, `/api/artifacts` | Transactional registration |
| POST | `/api/beings/{id}/powers`, `/api/beings/{id}/curses` | Add relationships |

Lists return `{ items, total, page, size }`. Pages start at 0; size defaults to 12 and accepts 1–100. Creation returns HTTP 201 with an `id` and `Location` header. Errors include `message` and `status`: 400 for invalid input, 404 for missing records, 409 for duplicates/constraint violations, and 503 for database access failures.

### Search filters and joins

| Resource | Filters |
| --- | --- |
| beings | `q`, `category`, `role` (`hero`/`villain`), `vitalState`, `alignment`, `powerId`, `minDanger`, `monsterCategory`, `divineParentId` |
| adventures | `q`, `status`, `localId`, `beingId`, `yearFrom`, `yearTo`, `oracleId`, `prophecyState` |
| artifacts | `q`, `materialId`, `type`, `cursed` (`true`/`false`), `forgerId` |

All accept `page` and `size`. Filters combine with AND; adventure text search matches name OR objective. Text search is partial and case-insensitive. Unknown parameters and invalid numeric ranges return 400. Category and status values retain their original Portuguese database spelling.

```text
/api/beings?category=Monstro&role=villain&minDanger=9&powerId=4
/api/beings?category=Semideus&role=hero&divineParentId=1
/api/adventures?beingId=12&localId=10&yearFrom=-1300&yearTo=-1200&oracleId=1&prophecyState=Cumprida
/api/artifacts?materialId=1&forgerId=18&cursed=false
```

For example, the monster search combines beings, monster attributes, villain roles, and powers:

```sql
SELECT s.id, s."Nome", m."GrauDePerigo"
FROM ser s
JOIN monstro m ON m.ser_id = s.id
WHERE m."GrauDePerigo" >= :minDanger
  AND EXISTS (SELECT 1 FROM vilao v WHERE v.ser_id = s.id)
  AND EXISTS (
    SELECT 1 FROM poder_ser ps
    WHERE ps.ser_id = s.id AND ps.poder_id = :powerId
  );
```

Adventure filters apply oracle and state to the **same prophecy**:

```sql
SELECT a.id, a."Nome", l."Nome" AS location
FROM aventura a LEFT JOIN local l ON l.id = a.local_id
WHERE EXISTS (
  SELECT 1 FROM profecia_aventura pa
  JOIN profecia p ON p.id = pa.profecia_id
  JOIN oraculo o ON o.id = p.oraculo_id
  WHERE pa.aventura_id = a.id AND o.id = :oracleId AND p."Estado" = :prophecyState
);
```

`EXISTS` avoids duplicate results, and `LEFT JOIN` preserves records without associations. User-supplied values are bound parameters, not interpolated SQL.

### Registration contracts

The following examples describe inserts. Use only a disposable local database to test them; referenced IDs must exist in that database.

**Being — `POST /api/beings`:**

```json
{
  "name": "Test character",
  "category": "Semideus",
  "vitalState": "Vivo",
  "alignment": "Bom",
  "attributes": {
    "divineParentId": 1,
    "mortalParentId": 53,
    "specialAbility": "Example ability"
  },
  "hero": { "motivation": "Protect the city", "mentor": "Mentor name" },
  "villain": null,
  "powers": [{ "powerId": 1, "level": 5 }],
  "curses": [{ "curseId": 1, "broken": false }]
}
```

Name, category, vital state, and the `attributes` object are required. Vital states are `Vivo`, `Morto`, `Imortal`, and `Desconhecido`.

| Category | Attributes (optional unless marked required) |
| --- | --- |
| Deus | `realm`, **`divineDomain` required**, `epithet`, `symbol` |
| Mortal | `occupation`, `birthDate` (YYYY-MM-DD), `originCity` |
| Semideus | **`divineParentId` and `mortalParentId` required**, `specialAbility` |
| Monstro | `habitat`, `dangerLevel` (1–10), `monsterCategory` |
| Titã | `gender`, `primordialDomain`, `generation` (greater than zero) |

`hero` accepts optional motivation and mentor. If provided, `villain` requires `objective` and accepts optional `threatLevel` (1–10).

**Adventure — `POST /api/adventures`:**

```json
{
  "name": "Test journey",
  "startYear": -1000,
  "objective": "Explore a region",
  "status": "Pendente",
  "duration": "2 days",
  "localId": 4,
  "participants": [{ "beingId": 7, "died": false }],
  "prophecyIds": [1]
}
```

Name, year, objective, status, and location are required. Status values are `Em Andamento`, `Concluida`, `Fracassada`, and `Pendente`. Participants and prophecies are optional. `died` records a death within that adventure; it does not change the being's global vital state.

**Artifact — `POST /api/artifacts`:**

```json
{
  "name": "Test artifact",
  "materialId": 1,
  "specialPower": "Example power",
  "cursed": false,
  "types": ["Relíquia"],
  "forges": [{ "materialId": 1, "forgerId": 18 }]
}
```

Only the name is required. Each forge requires an existing material and forger.

To associate existing records with a being:

- `POST /api/beings/{id}/powers`: `{ "powerId": 1, "level": 5 }`
- `POST /api/beings/{id}/curses`: `{ "curseId": 1, "broken": false }`

These operations create links rather than replacing existing ones. Duplicate links return 409.

## Testing

Run the isolated Docker test project:

```bash
docker compose -p mythology-tests -f compose.test.yml up --build --abort-on-container-exit --exit-code-from tests
docker compose -p mythology-tests -f compose.test.yml down
```

This creates an ephemeral PostgreSQL 15 database without exposed ports or Neon environment files. Tests use copies of the original 27 table definitions and synthetic data.

Alternatively, with Java 21 and Maven 3.9+, create a dedicated local database named `mythology_test`, set `TEST_DATABASE_URL`, `TEST_DATABASE_USER`, and `TEST_DATABASE_PASSWORD`, and run `mvn test` in `backend/demo`. The JDBC URL must use `localhost`, `127.0.0.1`, or `test-db`, with an explicit port and that exact database name. Without `TEST_DATABASE_URL`, integration tests are skipped; a successful command alone does not validate database behavior.

For the frontend, use Node 24:

```bash
cd frontend
npm ci
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
npm run test:refresh
```

`npm run test:refresh` runs an isolated browser regression test with all API responses mocked, including a failed selector refresh after a successful registration. It never accesses a database.

Browser tests default to `http://127.0.0.1:3000`, configurable through `E2E_BASE_URL`, and are **read-only by default**. They expect the original Database I records. For registration scenarios, connect the backend to a **disposable local copy** and set `E2E_WRITES=local-test-database`. Do not enable write tests while the API is connected to Neon. Set `E2E_SCREENSHOTS` to save desktop/mobile captures.

Database compatibility was tested against a local copy of `mitologia.sql`, not against the live Neon schema.

## Deployment

Production images separate the backend JRE 21 runtime from the compiled frontend served by Nginx, which proxies `/api`. To try the production configuration:

```bash
docker compose -f compose.production.yml up --build
```

The frontend is available at `http://localhost:3000`. Configure the backend connection in `backend/demo/.env`; no SQL script is loaded.

On a Docker/Compose server, use this configuration and configure HTTPS for the domain. On a container platform:

- **Backend:** build context `backend/demo`, target `production`, Neon variables stored as service secrets, `PORT` (default 8080), and health check `/api/health`.
- **Frontend:** build context `frontend`, target `production`, build argument `VITE_API_URL=/api`, runtime `BACKEND_HOST` set to the API's private `host:port` without a URL scheme, and `PORT` (default 8080).
- For static frontend hosting on another origin, set `VITE_API_URL` to the public HTTPS API URL at build time and `CORS_ALLOWED_ORIGINS` to the exact frontend HTTPS origin, or comma-separated origins.

`vite preview` does not proxy `/api`; use the Vite development server or production Nginx for integrated validation.
