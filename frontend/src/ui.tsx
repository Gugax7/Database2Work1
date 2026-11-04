import type { ReactNode } from "react";
import { display } from "./api";
export function Notice({
  error,
  retry,
}: {
  error: string;
  retry?: () => void;
}) {
  return (
    <div className="notice error" role="alert">
      <strong>Algo interrompeu a consulta</strong>
      <p>{error}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Consultando os registros…
    </div>
  );
}
export function Empty({
  children = "Nenhum vínculo cadastrado.",
}: {
  children?: ReactNode;
}) {
  return <p className="empty">{children}</p>;
}
export function Select({
  label,
  name,
  options = [],
  value = "",
  required = false,
  emptyLabel = "Não informado",
  onChange,
}: {
  label: string;
  name: string;
  options?: { id?: number | string; name: string }[];
  value?: string;
  required?: boolean;
  emptyLabel?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>
      <select
        name={name}
        aria-label={label}
        defaultValue={value}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">{required ? "Selecione…" : emptyLabel}</option>
        {options.map((item, i) => (
          <option
            key={item.id ?? `${item.name}-${i}`}
            value={item.id ?? item.name}
          >
            {display(item.name)}
          </option>
        ))}
      </select>
    </label>
  );
}
