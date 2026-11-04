import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  adventureStates,
  categories,
  display,
  prophecyStates,
  target,
  vitalStates,
  year,
  type Options,
  type Page,
  type Row,
} from "./api";
import { useResource, useRoute } from "./hooks";
import { Register } from "./Register";
import { DetailPage } from "./Details";
import { Loading, Notice, Select } from "./ui";
import { choices } from "./api";
import "./App.css";

const names: Record<string, string> = {
  beings: "Seres",
  adventures: "Aventuras",
  artifacts: "Artefatos",
};
const symbols: Record<string, string> = {
  Deus: "ϟ",
  Semideus: "✦",
  Mortal: "♜",
  Monstro: "♞",
  Titã: "◈",
  adventures: "⌁",
  artifacts: "⚒",
};
function Card({ row, resource }: { row: Row; resource: string }) {
  const category = String(row.category ?? resource);
  return (
    <a className={`record-card ${resource}`} href={`#/${resource}/${row.id}`}>
      <div className={`card-emblem emblem-${category}`} aria-hidden="true">
        {symbols[category] ?? "✦"}
        <span className="emblem-ring" />
      </div>
      <div className="card-body">
        <div className="eyebrow">
          {resource === "beings"
            ? category
            : resource === "adventures"
              ? display(row.status)
              : display(row.materialName)}
        </div>
        <h3>{row.name}</h3>
        {resource === "beings" && (
          <>
            <p>
              {row.domain ||
                `${display(row.vitalState)} · ${display(row.alignment)}`}
            </p>
            <div className="tags">
              {row.hero && <span>Herói</span>}
              {row.villain && <span>Vilão</span>}
              {row.dangerLevel && <span>Perigo {row.dangerLevel}/10</span>}
            </div>
          </>
        )}
        {resource === "adventures" && (
          <>
            <p className="clamp">{row.objective}</p>
            <div className="card-meta">
              {year(row.startYear)} · {display(row.localName)}
            </div>
          </>
        )}
        {resource === "artifacts" && (
          <>
            <p className="clamp">{display(row.specialPower)}</p>
            {row.cursed && <span className="tag warning">Amaldiçoado</span>}
          </>
        )}
        <span className="card-link">
          Explorar registro <span aria-hidden="true">↗</span>
        </span>
      </div>
    </a>
  );
}
function Home({ version }: { version: number }) {
  const summary = useResource<Record<string, number>>("/summary", version);
  const featured = useResource<Page>("/beings?role=hero&size=3", version);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    window.location.hash = `/${form.get("scope")}?q=${encodeURIComponent(String(form.get("q") ?? "").trim())}`;
  }
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">UM ACERVO DE HISTÓRIAS CONECTADAS</p>
          <h1>
            Todo mito tem
            <br />
            uma <em>história além.</em>
          </h1>
          <p className="hero-description">
            Entre deuses e mortais, descubra os encontros, as jornadas e os
            poderes que dão forma à mitologia grega.
          </p>
          <form className="hero-search" onSubmit={search}>
            <label className="sr-only" htmlFor="home-search">
              O que você procura?
            </label>
            <input
              id="home-search"
              name="q"
              placeholder="Um nome, uma jornada, uma descoberta…"
              maxLength={100}
            />
            <select name="scope" aria-label="Onde buscar">
              <option value="beings">Seres</option>
              <option value="adventures">Aventuras</option>
              <option value="artifacts">Artefatos</option>
            </select>
            <button className="button" type="submit">
              Explorar <span aria-hidden="true">→</span>
            </button>
          </form>
          <div className="hero-caption">
            <span aria-hidden="true">✦</span> Explore o que une os personagens
            às suas histórias.
          </div>
        </div>
        <div className="temple" aria-hidden="true">
          <div className="sun-disc" />
          <span className="temple-label">ΜΥΘΟΣ</span>
          <div className="pediment" />
          <div className="architrave" />
          <div className="pillars">
            {[0, 1, 2, 3].map((i) => (
              <div className="pillar" key={i}>
                <span />
                <i />
                <b />
              </div>
            ))}
          </div>
          <div className="temple-steps" />
          <span className="temple-note">Histórias que atravessam o tempo</span>
        </div>
      </section>
      <section className="stats-strip" aria-label="O acervo em números">
        {summary.error ? (
          <Notice error={summary.error} retry={summary.reload} />
        ) : !summary.data ? (
          <Loading />
        ) : (
          [
            ["beings", "seres mitológicos"],
            ["adventures", "aventuras"],
            ["artifacts", "artefatos"],
            ["places", "lugares"],
            ["prophecies", "profecias"],
          ].map(([key, label]) => (
            <div key={key}>
              <strong>{summary.data![key]}</strong>
              <span>{label}</span>
            </div>
          ))
        )}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ESCOLHA SEU CAMINHO</p>
            <h2>Um universo para explorar</h2>
          </div>
          <p>
            Uma história leva a outra.
            <br />
            Siga as conexões.
          </p>
        </div>
        <div className="path-grid">
          {[
            [
              "beings",
              "01",
              "Entre o divino e o humano",
              "Conheça deuses, semideuses, mortais, monstros e titãs.",
            ],
            [
              "adventures",
              "02",
              "Jornadas que viraram lendas",
              "Siga participantes, batalhas e profecias de cada aventura.",
            ],
            [
              "artifacts",
              "03",
              "Objetos de poder",
              "Descubra materiais, poderes especiais e os registros de forja.",
            ],
          ].map(([resource, n, title, text]) => (
            <a key={resource} href={`#/${resource}`} className="path-card">
              <span className="path-number">
                {n} / {names[resource]}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="path-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PERSONAGENS DO ACERVO</p>
            <h2>Por trás dos feitos heroicos</h2>
          </div>
          <a className="text-link" href="#/beings?role=hero">
            Todos os heróis →
          </a>
        </div>
        {featured.error ? (
          <Notice error={featured.error} retry={featured.reload} />
        ) : !featured.data ? (
          <Loading />
        ) : (
          <div className="card-grid">
            {featured.data.items.map((row) => (
              <Card key={String(row.id)} resource="beings" row={row} />
            ))}
          </div>
        )}
      </section>
      <section className="contribute">
        <span aria-hidden="true">✎</span>
        <div>
          <p className="eyebrow">O ACERVO CONTINUA</p>
          <h2>Ajude a registrar a próxima história.</h2>
          <p>
            Cadastre seres, aventuras e artefatos e conecte novos registros à
            enciclopédia.
          </p>
        </div>
        <a className="button" href="#/register/beings">
          Adicionar um registro →
        </a>
      </section>
    </>
  );
}
function Filters({
  resource,
  params,
  options,
}: {
  resource: string;
  params: URLSearchParams;
  options: Options;
}) {
  const [category, setCategory] = useState(params.get("category") ?? "");
  const select = (
    name: string,
    label: string,
    items: { id?: number | string; name: string }[],
  ) => (
    <Select
      key={name}
      name={name}
      label={label}
      options={items}
      emptyLabel="Todos"
      value={params.get(name) ?? ""}
      onChange={name === "category" ? setCategory : undefined}
    />
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (String(value).trim()) next.set(key, String(value).trim());
    });
    window.location.hash = target(resource, next);
  }
  return (
    <form
      className="filters panel"
      onSubmit={submit}
      onReset={() => {
        setCategory("");
        window.location.hash = `#/${resource}`;
      }}
    >
      <div className="filter-header">
        <h2>Refine sua descoberta</h2>
        <button type="reset" className="text-button">
          Limpar filtros
        </button>
      </div>
      <div className="filter-grid">
        <label className="field search-field">
          <span>
            {resource === "adventures" ? "Nome ou objetivo" : "Buscar por nome"}
          </span>
          <input
            name="q"
            placeholder="Digite sua busca…"
            defaultValue={params.get("q") ?? ""}
            maxLength={100}
          />
        </label>
        {resource === "beings" && (
          <>
            {select("category", "Categoria", choices(categories))}
            {select("role", "Papel adicional", [
              { id: "hero", name: "Herói" },
              { id: "villain", name: "Vilão" },
            ])}
            {select("vitalState", "Estado vital", choices(vitalStates))}
            {select("alignment", "Alinhamento", options.alignments)}
            {select("powerId", "Poder", options.powers)}
            {(!category || category === "Monstro") && (
              <>
                {select(
                  "monsterCategory",
                  "Tipo de monstro",
                  options.monsterCategories,
                )}
                <label className="field">
                  <span>Perigo mínimo (1 a 10)</span>
                  <input
                    name="minDanger"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={params.get("minDanger") ?? ""}
                  />
                </label>
              </>
            )}
            {(!category || category === "Semideus") &&
              select("divineParentId", "Ascendente divino", options.gods)}
          </>
        )}
        {resource === "adventures" && (
          <>
            {select("status", "Status da aventura", choices(adventureStates))}
            {select("localId", "Local", options.places)}
            {select("beingId", "Participante", options.beings)}
            <label className="field">
              <span>Ano a partir de</span>
              <input
                name="yearFrom"
                type="number"
                min="-100000"
                max="100000"
                placeholder="Ex.: -1300"
                defaultValue={params.get("yearFrom") ?? ""}
              />
            </label>
            <label className="field">
              <span>Ano até</span>
              <input
                name="yearTo"
                type="number"
                min="-100000"
                max="100000"
                placeholder="Ex.: -1100"
                defaultValue={params.get("yearTo") ?? ""}
              />
            </label>
            {select("oracleId", "Oráculo da profecia", options.oracles)}
            {select(
              "prophecyState",
              "Estado da profecia",
              choices(prophecyStates),
            )}
          </>
        )}
        {resource === "artifacts" && (
          <>
            {select("materialId", "Material", options.materials)}
            {select("type", "Tipo", options.artifactTypes)}
            {select("cursed", "Maldição", [
              { id: "true", name: "Amaldiçoado" },
              { id: "false", name: "Não amaldiçoado" },
            ])}
            {select("forgerId", "Forjador", options.beings)}
          </>
        )}
      </div>
      <div className="filter-footer">
        <small>
          {resource === "adventures"
            ? "Use anos negativos para a.C. Filtros de oráculo e estado consultam a mesma profecia."
            : resource === "artifacts"
              ? "Ao combinar material e forjador, ambos devem constar na mesma forja."
              : "Combine os filtros para encontrar relações entre os registros."}
        </small>
        <button className="button">Aplicar filtros →</button>
      </div>
    </form>
  );
}
function Explore({
  resource,
  query,
  params,
  options,
  version,
}: {
  resource: string;
  query: string;
  params: URLSearchParams;
  options: Options;
  version: number;
}) {
  const result = useResource<Page>(`/${resource}?${query}`, version);
  const descriptions: Record<string, string> = {
    beings: "Encontre personagens pelos seus atributos, poderes e origens.",
    adventures:
      "Siga jornadas por lugares, participantes e palavras dos oráculos.",
    artifacts: "Conheça os objetos, seus materiais e quem os forjou.",
  };
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXPLORE A ENCICLOPÉDIA</p>
          <h1>{names[resource]}</h1>
          <p>{descriptions[resource]}</p>
        </div>
        <a className="button secondary" href={`#/register/${resource}`}>
          + Novo registro
        </a>
      </div>
      <Filters
        key={resource + query}
        resource={resource}
        params={params}
        options={options}
      />
      {result.error ? (
        <Notice error={result.error} retry={result.reload} />
      ) : !result.data ? (
        <Loading />
      ) : (
        <>
          <div className="results-heading">
            <h2>
              {result.data.total}{" "}
              {result.data.total === 1
                ? "registro encontrado"
                : "registros encontrados"}
            </h2>
            <span>Acervo de mitologia grega</span>
          </div>
          {result.data.items.length ? (
            <div className="card-grid">
              {result.data.items.map((row) => (
                <Card key={String(row.id)} resource={resource} row={row} />
              ))}
            </div>
          ) : (
            <div className="panel no-results">
              <span aria-hidden="true">⌕</span>
              <h3>Nenhum registro nesta busca</h3>
              <p>Tente retirar um filtro ou buscar por outro nome.</p>
              <a className="text-link" href={`#/${resource}`}>
                Ver todos os registros →
              </a>
            </div>
          )}
          <nav className="pagination" aria-label="Páginas de resultados">
            <button
              className="button secondary"
              disabled={result.data.page === 0}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(result.data!.page - 1));
                window.location.hash = target(resource, next);
              }}
            >
              ← Anterior
            </button>
            <span>
              Página {result.data.page + 1} de{" "}
              {Math.max(1, Math.ceil(result.data.total / result.data.size))}
            </span>
            <button
              className="button secondary"
              disabled={
                (result.data.page + 1) * result.data.size >= result.data.total
              }
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(result.data!.page + 1));
                window.location.hash = target(resource, next);
              }}
            >
              Próxima →
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
export default function App() {
  const { path, params, query } = useRoute();
  const [version, setVersion] = useState(0);
  const changed = () => setVersion((n) => n + 1);
  const options = useResource<Options>("/options", version);
  const parts = path.split("/").filter(Boolean);
  const resource = parts[0];
  useEffect(() => {
    document.title = `${names[resource] ?? (resource === "register" ? "Novo registro" : "Enciclopédia")} · Mythos`;
  }, [resource]);
  let content: ReactNode;
  if (!resource) content = <Home version={version} />;
  else if (resource === "register" || resource in names) {
    content =
      options.error && !options.data ? (
        <section className="page">
          <Notice error={options.error} retry={options.reload} />
        </section>
      ) : !options.data ? (
        <Loading />
      ) : resource === "register" ? (
        <Register
          key={parts[1]}
          resource={parts[1] ?? "beings"}
          options={options.data}
          changed={changed}
        />
      ) : parts[1] ? (
        <DetailPage
          key={`${resource}/${parts[1]}`}
          resource={resource}
          id={parts[1]}
          options={options.data}
          version={version}
          changed={changed}
        />
      ) : (
        <Explore
          resource={resource}
          query={query}
          params={params}
          options={options.data}
          version={version}
        />
      );
  } else
    content = (
      <section className="page">
        <h1>Página não encontrada</h1>
        <a href="#/" className="button">
          Voltar ao início
        </a>
      </section>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="Mythos, início">
          <span className="brand-mark" aria-hidden="true">
            Μ
          </span>
          <span>
            mythos<small>ENCICLOPÉDIA GREGA</small>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#/" aria-current={!resource ? "page" : undefined}>
            Início
          </a>
          {Object.entries(names).map(([key, name]) => (
            <a
              key={key}
              href={`#/${key}`}
              aria-current={resource === key ? "page" : undefined}
            >
              {name}
            </a>
          ))}
        </nav>
        <a
          className="header-add"
          href="#/register/beings"
          aria-current={resource === "register" ? "page" : undefined}
        >
          <span aria-hidden="true">+</span> Contribuir
        </a>
      </header>
      <main id="main-content" tabIndex={-1}>
        {options.error && options.data && (
          <div className="notice" role="status">
            <p>
              Não foi possível atualizar os seletores. Os dados já carregados
              foram mantidos; os cadastros concluídos continuam salvos.
            </p>
            <button className="button secondary" onClick={options.reload}>
              Atualizar seletores
            </button>
          </div>
        )}
        {content}
      </main>
      <footer className="site-footer">
        <a className="brand" href="#/">
          mythos<span className="footer-dot">✦</span>
        </a>
        <p>Mitologia grega, uma conexão de cada vez.</p>
        <small>Projeto de Banco de Dados II</small>
      </footer>
    </>
  );
}
