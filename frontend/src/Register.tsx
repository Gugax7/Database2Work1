import { useState, type FormEvent } from "react";
import {
  adventureStates,
  categories,
  post,
  vitalStates,
  type Options,
} from "./api";
import { Select } from "./ui";
import { choices } from "./api";

type Kind =
  "powers" | "curses" | "participants" | "prophecies" | "forges" | "types";
type Link = {
  key: number;
  first: string;
  second: string;
  level: string;
  flag: boolean;
};
const linkNames: Record<Kind, string> = {
  powers: "Poderes",
  curses: "Maldições",
  participants: "Participantes",
  prophecies: "Profecias",
  forges: "Registros de forja",
  types: "Tipos do artefato",
};
function Links({ kind, options }: { kind: Kind; options: Options }) {
  const [rows, setRows] = useState<Link[]>([]);
  function update(key: number, values: Partial<Link>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...values } : row)),
    );
  }
  const source =
    kind === "participants" ? "beings" : kind === "forges" ? "materials" : kind;
  return (
    <section className="link-editor">
      <div className="detail-section-heading">
        <h3>{linkNames[kind]}</h3>
        <button
          type="button"
          className="text-button"
          disabled={rows.length >= 100}
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                key: Math.max(0, ...current.map((r) => r.key)) + 1,
                first: "",
                second: "",
                level: "",
                flag: false,
              },
            ])
          }
        >
          + Adicionar
        </button>
      </div>
      {!rows.length && (
        <p className="empty">
          Opcional. Adicione os vínculos que deseja registrar.
        </p>
      )}
      {rows.map((row, index) => (
        <div className="link-row" key={row.key}>
          {kind === "types" ? (
            <label className="field">
              <span>Tipo {index + 1} *</span>
              <input
                list="artifact-type-suggestions"
                required
                maxLength={50}
                value={row.first}
                onChange={(e) => update(row.key, { first: e.target.value })}
              />
            </label>
          ) : (
            <Select
              label={`${kind === "forges" ? "Material" : linkNames[kind]} ${index + 1}`}
              name={`${kind}-${row.key}`}
              options={options[source]}
              required
              onChange={(first) => update(row.key, { first })}
            />
          )}
          {kind === "forges" && (
            <Select
              label="Forjador"
              name={`forger-${row.key}`}
              options={options.beings}
              required
              onChange={(second) => update(row.key, { second })}
            />
          )}
          {kind === "powers" && (
            <label className="field">
              <span>Nível de domínio (1 a 10)</span>
              <input
                type="number"
                min={1}
                max={10}
                value={row.level}
                onChange={(e) => update(row.key, { level: e.target.value })}
              />
            </label>
          )}
          {(kind === "curses" || kind === "participants") && (
            <label className="check">
              <input
                type="checkbox"
                checked={row.flag}
                onChange={(e) => update(row.key, { flag: e.target.checked })}
              />
              {kind === "curses" ? "Já quebrada" : "Morreu nesta aventura"}
            </label>
          )}
          <button
            type="button"
            className="remove-link"
            aria-label={`Remover ${linkNames[kind].toLowerCase()} ${index + 1}`}
            onClick={() =>
              setRows((current) => current.filter((r) => r.key !== row.key))
            }
          >
            Remover
          </button>
        </div>
      ))}
      <input
        type="hidden"
        name={`links-${kind}`}
        value={JSON.stringify(rows)}
      />
      {kind === "types" && (
        <datalist id="artifact-type-suggestions">
          {options.artifactTypes.map((t) => (
            <option key={t.name} value={t.name} />
          ))}
        </datalist>
      )}
    </section>
  );
}
function Text({
  name,
  label,
  required = false,
  max = 100,
  type = "text",
  min,
  maximum,
}: {
  name: string;
  label: string;
  required?: boolean;
  max?: number;
  type?: string;
  min?: number;
  maximum?: number;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>
      <input
        name={name}
        aria-label={label}
        type={type}
        required={required}
        maxLength={max}
        min={min}
        max={maximum}
      />
    </label>
  );
}
function Area({
  name,
  label,
  required = false,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="field full">
      <span>
        {label}
        {required && " *"}
      </span>
      <textarea
        name={name}
        aria-label={label}
        required={required}
        maxLength={10000}
        rows={3}
      />
    </label>
  );
}
export function Register({
  resource,
  options,
  changed,
}: {
  resource: string;
  options: Options;
  changed: () => void;
}) {
  const [category, setCategory] = useState("");
  const [hero, setHero] = useState(false);
  const [villain, setVillain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: number; name: string } | null>(null);
  const [generation, setGeneration] = useState(0);
  const titles: Record<string, string> = {
    beings: "ser",
    adventures: "aventura",
    artifacts: "artefato",
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || null;
    const num = (name: string) =>
      value(name) === null ? null : Number(value(name));
    const links = (kind: Kind): Link[] =>
      JSON.parse(String(data.get(`links-${kind}`) ?? "[]"));
    let body: unknown;
    if (resource === "beings") {
      const attributes: Record<string, unknown> = {};
      for (const key of [
        "realm",
        "divineDomain",
        "epithet",
        "symbol",
        "occupation",
        "birthDate",
        "originCity",
        "specialAbility",
        "habitat",
        "monsterCategory",
        "gender",
        "primordialDomain",
      ])
        attributes[key] = value(key);
      for (const key of [
        "divineParentId",
        "mortalParentId",
        "dangerLevel",
        "generation",
      ])
        attributes[key] = num(key);
      body = {
        name: value("name"),
        category,
        vitalState: value("vitalState"),
        alignment: value("alignment"),
        attributes,
        hero: hero
          ? { motivation: value("motivation"), mentor: value("mentor") }
          : null,
        villain: villain
          ? {
              objective: value("villainObjective"),
              threatLevel: num("threatLevel"),
            }
          : null,
        powers: links("powers").map((r) => ({
          powerId: Number(r.first),
          level: r.level ? Number(r.level) : null,
        })),
        curses: links("curses").map((r) => ({
          curseId: Number(r.first),
          broken: r.flag,
        })),
      };
    } else if (resource === "adventures")
      body = {
        name: value("name"),
        startYear: num("startYear"),
        objective: value("objective"),
        status: value("status"),
        duration: value("duration"),
        localId: num("localId"),
        participants: links("participants").map((r) => ({
          beingId: Number(r.first),
          died: r.flag,
        })),
        prophecyIds: links("prophecies").map((r) => Number(r.first)),
      };
    else
      body = {
        name: value("name"),
        materialId: num("materialId"),
        specialPower: value("specialPower"),
        cursed: data.get("cursed") === "on",
        types: links("types").map((r) => r.first.trim()),
        forges: links("forges").map((r) => ({
          materialId: Number(r.first),
          forgerId: Number(r.second),
        })),
      };
    try {
      const result = await post<{ id: number }>(`/${resource}`, body);
      setSaved({ id: result.id, name: value("name")! });
      changed();
      window.scrollTo(0, 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!(resource in titles))
    return (
      <section className="page">
        <h1>Tipo de cadastro não encontrado</h1>
        <a href="#/register/beings">Cadastrar um ser</a>
      </section>
    );
  return (
    <section className="page register-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTRIBUA COM O ACERVO</p>
          <h1>Uma nova história começa aqui.</h1>
          <p>
            Registre informações e conecte-as aos personagens e lugares da
            enciclopédia.
          </p>
        </div>
      </div>
      <nav className="tabs" aria-label="Tipo de cadastro">
        {Object.entries(titles).map(([key, name]) => (
          <a
            href={`#/register/${key}`}
            key={key}
            aria-current={resource === key ? "page" : undefined}
          >
            {name[0].toUpperCase() + name.slice(1)}
          </a>
        ))}
      </nav>
      {saved ? (
        <div className="panel saved" role="status">
          <span className="saved-symbol" aria-hidden="true">
            ✓
          </span>
          <p className="eyebrow">REGISTRO CONCLUÍDO</p>
          <h2>{saved.name} agora faz parte do acervo.</h2>
          <p>Os dados e seus vínculos foram salvos com sucesso.</p>
          <div className="actions">
            <a className="button" href={`#/${resource}/${saved.id}`}>
              Abrir ficha →
            </a>
            <button
              className="button secondary"
              onClick={() => {
                setSaved(null);
                setCategory("");
                setHero(false);
                setVillain(false);
                setGeneration((n) => n + 1);
              }}
            >
              Cadastrar outro {titles[resource]}
            </button>
          </div>
        </div>
      ) : (
        <form key={generation} onSubmit={submit} className="registration-form">
          <fieldset disabled={busy}>
            <section className="panel form-section">
              <div className="form-section-title">
                <span>01</span>
                <div>
                  <h2>Informações principais</h2>
                  <p>Campos marcados com * são obrigatórios.</p>
                </div>
              </div>
              <div className="form-grid">
                <Text name="name" label="Nome" required />
                {resource === "beings" && (
                  <>
                    <Select
                      name="category"
                      label="Categoria"
                      options={choices(categories)}
                      required
                      onChange={setCategory}
                    />
                    <Select
                      name="vitalState"
                      label="Estado vital"
                      options={choices(vitalStates)}
                      required
                    />
                    <label className="field">
                      <span>Alinhamento</span>
                      <input
                        name="alignment"
                        list="alignment-suggestions"
                        maxLength={50}
                      />
                      <datalist id="alignment-suggestions">
                        {options.alignments.map((o) => (
                          <option key={o.name} value={o.name} />
                        ))}
                      </datalist>
                    </label>
                  </>
                )}
                {resource === "adventures" && (
                  <>
                    <Text
                      name="startYear"
                      label="Ano de início (negativo para a.C.)"
                      type="number"
                      min={-100000}
                      maximum={100000}
                      required
                    />
                    <Select
                      name="status"
                      label="Status"
                      options={choices(adventureStates)}
                      required
                    />
                    <Select
                      name="localId"
                      label="Local"
                      options={options.places}
                      required
                    />
                    <Text name="duration" label="Duração" max={50} />
                    <Area
                      name="objective"
                      label="Objetivo da aventura"
                      required
                    />
                  </>
                )}
                {resource === "artifacts" && (
                  <>
                    <Select
                      name="materialId"
                      label="Material principal"
                      options={options.materials}
                    />
                    <label className="check">
                      <input name="cursed" type="checkbox" />
                      Artefato amaldiçoado
                    </label>
                    <Area name="specialPower" label="Poder especial" />
                  </>
                )}
              </div>
            </section>
            {resource === "beings" && (
              <>
                <section className="panel form-section">
                  <div className="form-section-title">
                    <span>02</span>
                    <div>
                      <h2>Atributos & papéis</h2>
                      <p>
                        Os papéis de herói e vilão podem coexistir com qualquer
                        categoria.
                      </p>
                    </div>
                  </div>
                  {!category && (
                    <p className="empty">
                      Selecione uma categoria para preencher seus atributos.
                    </p>
                  )}
                  <div className="form-grid" key={category}>
                    {category === "Deus" && (
                      <>
                        <Text name="realm" label="Reino" />
                        <Text
                          name="divineDomain"
                          label="Domínio divino"
                          required
                        />
                        <Text name="epithet" label="Epíteto" />
                        <Text name="symbol" label="Símbolo" />
                      </>
                    )}
                    {category === "Mortal" && (
                      <>
                        <Text name="occupation" label="Ocupação" />
                        <Text
                          name="birthDate"
                          label="Data de nascimento"
                          type="date"
                        />
                        <Text name="originCity" label="Cidade de origem" />
                      </>
                    )}
                    {category === "Semideus" && (
                      <>
                        <Select
                          name="divineParentId"
                          label="Ascendente divino"
                          options={options.gods}
                          required
                        />
                        <Select
                          name="mortalParentId"
                          label="Ascendente mortal"
                          options={options.mortals}
                          required
                        />
                        <Area
                          name="specialAbility"
                          label="Habilidade especial"
                        />
                      </>
                    )}
                    {category === "Monstro" && (
                      <>
                        <Text name="habitat" label="Região de habitação" />
                        <Text
                          name="dangerLevel"
                          label="Grau de perigo (1 a 10)"
                          type="number"
                          min={1}
                          maximum={10}
                        />
                        <Text
                          name="monsterCategory"
                          label="Tipo de monstro"
                          max={50}
                        />
                      </>
                    )}
                    {category === "Titã" && (
                      <>
                        <Text name="gender" label="Gênero" max={20} />
                        <Text
                          name="primordialDomain"
                          label="Domínio primordial"
                        />
                        <Text
                          name="generation"
                          label="Geração"
                          type="number"
                          min={1}
                          maximum={2147483647}
                        />
                      </>
                    )}
                  </div>
                  <div className="role-choices">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={hero}
                        onChange={(e) => setHero(e.target.checked)}
                      />
                      Também é herói
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={villain}
                        onChange={(e) => setVillain(e.target.checked)}
                      />
                      Também é vilão
                    </label>
                  </div>
                  {hero && (
                    <div className="form-grid role-fields">
                      <Area name="motivation" label="Motivação do herói" />
                      <Text name="mentor" label="Mentor" />
                    </div>
                  )}
                  {villain && (
                    <div className="form-grid role-fields">
                      <Area
                        name="villainObjective"
                        label="Objetivo do vilão"
                        required
                      />
                      <Text
                        name="threatLevel"
                        label="Nível de ameaça (1 a 10)"
                        type="number"
                        min={1}
                        maximum={10}
                      />
                    </div>
                  )}
                </section>
                <section className="panel form-section">
                  <div className="form-section-title">
                    <span>03</span>
                    <div>
                      <h2>Conexões</h2>
                      <p>
                        Associe poderes e maldições já existentes no acervo.
                      </p>
                    </div>
                  </div>
                  <Links kind="powers" options={options} />
                  <Links kind="curses" options={options} />
                </section>
              </>
            )}
            {resource === "adventures" && (
              <section className="panel form-section">
                <div className="form-section-title">
                  <span>02</span>
                  <div>
                    <h2>Quem faz parte desta jornada?</h2>
                    <p>Associe os participantes e as profecias relacionadas.</p>
                  </div>
                </div>
                <Links kind="participants" options={options} />
                <Links kind="prophecies" options={options} />
              </section>
            )}
            {resource === "artifacts" && (
              <section className="panel form-section">
                <div className="form-section-title">
                  <span>02</span>
                  <div>
                    <h2>Tipos & origem da forja</h2>
                    <p>
                      Registre os tipos e, quando conhecidos, materiais e
                      forjadores.
                    </p>
                  </div>
                </div>
                <Links kind="types" options={options} />
                <Links kind="forges" options={options} />
              </section>
            )}
            <div className="form-submit">
              <p>Confira os dados antes de adicionar ao acervo.</p>
              <button type="submit" className="button" disabled={busy}>
                {busy
                  ? "Salvando registro…"
                  : `Cadastrar ${titles[resource]} →`}
              </button>
            </div>
          </fieldset>
          {error && (
            <div className="notice error" role="alert">
              <strong>O cadastro não foi concluído</strong>
              <p>{error}</p>
              <p>
                Revise os dados e tente novamente. Os campos foram preservados.
              </p>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
