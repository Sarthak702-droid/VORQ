import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { decodeStore, emptyStore, type Store } from "../domain/records";

const KEY = "vorq.mobile.workspace.v1";
interface Workspace {
  data: Store;
  ready: boolean;
  error: string;
  busy: boolean;
  change: (update: (store: Store) => Store) => Promise<void>;
}
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useRef(data);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const loaded = raw ? decodeStore(raw) : emptyStore;
        if (active) {
          current.current = loaded;
          setData(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Saved records could not be read. Your stored data has been preserved. Restart the app or recover the device data before continuing.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function change(update: (store: Store) => Store) {
    if (!ready || saving.current)
      throw new Error("Please wait for the current operation.");
    saving.current = true;
    setBusy(true);
    try {
      const next = update(current.current);
      decodeStore(JSON.stringify(next));
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setData(next);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ data, ready, error, busy, change }}>
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider is required.");
  return value;
}
