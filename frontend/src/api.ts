export type Row = { [key: string]: string | number | boolean | null };
export type Option = {
  id?: number;
  name: string;
  category?: string;
  region?: string;
};
export type Options = Record<string, Option[]>;
export const choices = (values: string[]) => values.map((name) => ({ name }));
export type Page = { items: Row[]; total: number; page: number; size: number };
export type RecordDetail = { id: number; name: string; [key: string]: unknown };
export const categories = ["Deus", "Semideus", "Mortal", "Monstro", "Titã"];
export const vitalStates = ["Vivo", "Morto", "Imortal", "Desconhecido"];
export const adventureStates = [
  "Em Andamento",
  "Concluida",
  "Fracassada",
  "Pendente",
];
export const prophecyStates = [
  "Pendente",
  "Cumprida",
  "Parcialmente Cumprida",
  "Anulada",
];
export const display = (value: unknown): string =>
  value === null || value === undefined || value === ""
    ? "Não informado"
    : value === true
      ? "Sim"
      : value === false
        ? "Não"
        : value === "Concluida"
          ? "Concluída"
          : String(value);
export const year = (value: unknown): string =>
  typeof value === "number"
    ? `${Math.abs(value)} ${value < 0 ? "a.C." : "d.C."}`
    : display(value);
const base = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new Error(
      "Não foi possível conectar à enciclopédia. Verifique a conexão e tente novamente.",
      { cause: error },
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message ?? "Não foi possível concluir a operação. Tente novamente.",
    );
  if (data === null)
    throw new Error(
      "A resposta recebida não é válida. Verifique se a API está disponível e tente novamente.",
    );
  return data as T;
}
export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
export function target(resource: string, params: URLSearchParams) {
  const query = params.toString();
  return `#/${resource}${query ? `?${query}` : ""}`;
}
