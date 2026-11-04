import { useEffect, useState, useSyncExternalStore } from "react";
import { request } from "./api";
const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
export function useRoute() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash || "#/",
    () => "#/",
  );
  const [path, query = ""] = hash.slice(1).split("?");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);
  return { path, params: new URLSearchParams(query), query };
}
export function useResource<T>(path: string, version = 0) {
  const [state, setState] = useState<{
    path: string;
    version: number;
    data?: T;
    error?: string;
  }>({ path: "", version: -1 });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request<T>(path, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ path, version, data });
      },
      (error) => {
        if (!controller.signal.aborted)
          setState((previous) => ({
            path,
            version,
            data: previous.path === path ? previous.data : undefined,
            error: error.message,
          }));
      },
    );
    return () => controller.abort();
  }, [path, version, retry]);
  const current = state.path === path && state.version === version;
  return {
    data: state.path === path ? state.data : undefined,
    error: current ? state.error : undefined,
    reload: () => {
      setState((s) => ({ ...s, error: undefined }));
      setRetry((n) => n + 1);
    },
  };
}
