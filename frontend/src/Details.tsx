import { useState, type FormEvent, type ReactNode } from "react";
import {
  display,
  post,
  year,
  type Options,
  type RecordDetail,
  type Row,
} from "./api";
import { useResource } from "./hooks";
import { Empty, Loading, Notice, Select } from "./ui";

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
const fieldLabels: Record<string, string> = {
  Reino: "Reino",
  DominioDivino: "Domínio divino",
  Epiteto: "Epíteto",
  Simbolo: "Símbolo",
  Ocupacao: "Ocupação",
  DataNasc: "Data de nascimento (como registrada)",
  CidadeOrigem: "Cidade de origem",
  HabilidadeEspecial: "Habilidade especial",
  RegiaoDeHabitacao: "Região de habitação",
  GrauDePerigo: "Grau de perigo",
  Categoria: "Tipo de monstro",
  Genero: "Gênero",
  DominioPrimordial: "Domínio primordial",
  Geracao: "Geração",
};
function Info({ items }: { items: [string, unknown][] }) {
  return (
    <dl className="info-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{display(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
function Related({
  title,
  rows,
  children,
}: {
  title: string;
  rows: Row[];
  children: (row: Row, index: number) => ReactNode;
}) {
  return (
    <section className="detail-section panel">
      <div className="detail-section-heading">
        <h2>{title}</h2>
        <span className="count">{rows.length}</span>
      </div>
      {rows.length ? (
        <div className="related-list">
          {rows.map((row, i) => (
            <div className="related-item" key={String(row.id ?? i)}>
              {children(row, i)}
            </div>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </section>
  );
}
function Associate({
  id,
  kind,
  options,
  done,
}: {
  id: number;
  kind: "powers" | "curses";
  options: Options;
  done: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await post(
        `/beings/${id}/${kind}`,
        kind === "powers"
          ? {
              powerId: Number(data.get("relation")),
              level: data.get("level") ? Number(data.get("level")) : null,
            }
          : {
              curseId: Number(data.get("relation")),
              broken: data.get("broken") === "on",
            },
      );
      form.reset();
      setSuccess("Vínculo cadastrado com sucesso.");
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="associate-form" onSubmit={submit}>
      <Select
        label={kind === "powers" ? "Poder existente" : "Maldição existente"}
        name="relation"
        options={options[kind]}
        required
      />
      {kind === "powers" ? (
        <label className="field">
          <span>Nível de domínio</span>
          <input type="number" name="level" min="1" max="10" />
        </label>
      ) : (
        <label className="check">
          <input name="broken" type="checkbox" />
          Maldição já quebrada
        </label>
      )}
      <button className="button secondary" disabled={busy}>
        {busy ? "Associando…" : "Associar"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="success">
          {success}
        </p>
      )}
    </form>
  );
}
export function DetailPage({
  resource,
  id,
  options,
  version,
  changed,
}: {
  resource: string;
  id: string;
  options: Options;
  version: number;
  changed: () => void;
}) {
  const result = useResource<RecordDetail>(`/${resource}/${id}`, version);
  if (result.error)
    return (
      <section className="page">
        <a className="text-link" href={`#/${resource}`}>
          ← Voltar para {names[resource].toLowerCase()}
        </a>
        <Notice error={result.error} retry={result.reload} />
      </section>
    );
  if (!result.data) return <Loading />;
  const d = result.data;
  const rows = (key: string) => (d[key] ?? []) as Row[];
  return (
    <section className="page">
      <a className="back-link" href={`#/${resource}`}>
        ← Explorar {names[resource].toLowerCase()}
      </a>
      <header className="detail-hero">
        <div className="detail-symbol" aria-hidden="true">
          {symbols[String(d.category ?? resource)] ?? "✦"}
        </div>
        <div>
          <p className="eyebrow">
            {resource === "beings" ? String(d.category) : names[resource]}
          </p>
          <h1>{d.name}</h1>
          <div className="tags">
            {resource === "beings" ? (
              <>
                <span>{display(d.vitalState)}</span>
                <span>{display(d.alignment)}</span>
                {rows("hero").length > 0 && <span>Herói</span>}
                {rows("villain").length > 0 && <span>Vilão</span>}
              </>
            ) : resource === "adventures" ? (
              <>
                <span>{display(d.status)}</span>
                <span>{year(d.startYear)}</span>
              </>
            ) : (
              <span>{d.cursed ? "Amaldiçoado" : "Não amaldiçoado"}</span>
            )}
          </div>
        </div>
      </header>
      {resource === "beings" && (
        <>
          <section className="panel detail-section">
            <h2>Identidade & atributos</h2>
            {rows("attributes").length ? (
              <Info
                items={Object.entries(rows("attributes")[0])
                  .filter(([key]) => key in fieldLabels)
                  .map(([key, value]) => [fieldLabels[key], value])}
              />
            ) : (
              <Empty>Atributos da categoria ainda não cadastrados.</Empty>
            )}
            {rows("hero").map((r, i) => (
              <Info
                key={i}
                items={[
                  ["Motivação do herói", r.motivation],
                  ["Mentor", r.mentor],
                ]}
              />
            ))}
            {rows("villain").map((r, i) => (
              <Info
                key={i}
                items={[
                  ["Objetivo do vilão", r.objective],
                  ["Nível de ameaça", r.threatLevel],
                ]}
              />
            ))}
          </section>
          {d.category === "Semideus" && (
            <Related title="Ascendência" rows={rows("parents")}>
              {(r) => (
                <>
                  <span className="eyebrow">{r.kind}</span>
                  <a href={`#/beings/${r.id}`}>{r.name} ↗</a>
                </>
              )}
            </Related>
          )}
          <div className="detail-columns">
            <div>
              <Related title="Poderes" rows={rows("powers")}>
                {(r) => (
                  <>
                    <h3>{r.name}</h3>
                    <p>
                      {display(r.origin)} · Intensidade {display(r.intensity)} ·
                      Domínio {display(r.level)}
                    </p>
                  </>
                )}
              </Related>
              <div className="panel association-panel">
                <h3>Associar um poder</h3>
                <Associate
                  id={d.id}
                  kind="powers"
                  options={options}
                  done={changed}
                />
              </div>
            </div>
            <div>
              <Related title="Maldições" rows={rows("curses")}>
                {(r) => (
                  <>
                    <h3>{r.name}</h3>
                    <p>
                      {display(r.severity)} · Lançada por {display(r.caster)}
                    </p>
                    <p>{r.broken ? "Quebrada" : "Não quebrada"}</p>
                    <small>Encerramento: {display(r.ending)}</small>
                  </>
                )}
              </Related>
              <div className="panel association-panel">
                <h3>Associar uma maldição</h3>
                <Associate
                  id={d.id}
                  kind="curses"
                  options={options}
                  done={changed}
                />
              </div>
            </div>
          </div>
          <Related title="Metamorfoses" rows={rows("metamorphoses")}>
            {(r) => (
              <>
                <h3>{r.form}</h3>
                <p>{display(r.reason)}</p>
                <p>{r.context}</p>
                <span className="tag">
                  {r.reversible ? "Reversível" : "Irreversível"}
                </span>
              </>
            )}
          </Related>
          <Related title="Aventuras" rows={rows("adventures")}>
            {(r) => (
              <>
                <a href={`#/adventures/${r.id}`}>{r.name} ↗</a>
                <p>
                  {display(r.status)} ·{" "}
                  {r.died
                    ? "Morte registrada nesta aventura"
                    : "Sem morte registrada nesta aventura"}
                </p>
              </>
            )}
          </Related>
          <Related title="Batalhas" rows={rows("battles")}>
            {(r) => (
              <>
                <h3>{r.name}</h3>
                <p>{display(r.result)}</p>
                {r.adventureId && (
                  <a href={`#/adventures/${r.adventureId}`}>
                    {r.adventureName} ↗
                  </a>
                )}
              </>
            )}
          </Related>
        </>
      )}
      {resource === "adventures" && (
        <>
          <section className="panel detail-section">
            <h2>A jornada</h2>
            <p className="lead">{String(d.objective)}</p>
            <Info
              items={[
                ["Duração", d.duration],
                ["Local", d.localName],
                ["Região", d.region],
                ["Tipo de local", d.localType],
                ["Divindade do local", d.localDeity],
              ]}
            />
          </section>
          <Related title="Participantes" rows={rows("participants")}>
            {(r) => (
              <>
                <a href={`#/beings/${r.id}`}>{r.name} ↗</a>
                <p>
                  {r.category} ·{" "}
                  {r.died
                    ? "Morte registrada nesta aventura"
                    : "Sem morte registrada nesta aventura"}
                </p>
              </>
            )}
          </Related>
          <Related title="Batalhas" rows={rows("battles")}>
            {(r) => (
              <>
                <h3>{r.name}</h3>
                <p>{display(r.result)}</p>
                <small>
                  Datas registradas: {display(r.startDate)} a{" "}
                  {display(r.endDate)}
                </small>
              </>
            )}
          </Related>
          <Related title="Profecias & oráculos" rows={rows("prophecies")}>
            {(r) => (
              <>
                <span className="eyebrow">
                  {r.oracle} · {display(r.state)}
                </span>
                <h3>{r.description}</h3>
                <p>{display(r.method)}</p>
                <small>Data registrada: {r.date}</small>
              </>
            )}
          </Related>
        </>
      )}
      {resource === "artifacts" && (
        <>
          <section className="panel detail-section">
            <h2>Natureza do artefato</h2>
            <p className="lead">{display(d.specialPower)}</p>
            <Info
              items={[
                ["Material principal", d.materialName],
                ["Origem mítica do material", d.materialOrigin],
                ["Dureza do material", d.hardness],
                ["Característica especial", d.materialFeature],
              ]}
            />
          </section>
          <Related title="Tipos" rows={rows("types")}>
            {(r) => <span className="tag">{r.name}</span>}
          </Related>
          <Related title="Registros de forja" rows={rows("forges")}>
            {(r) => (
              <>
                <a href={`#/beings/${r.forgerId}`}>{r.forger} ↗</a>
                <p>Material: {display(r.material)}</p>
              </>
            )}
          </Related>
        </>
      )}
    </section>
  );
}
