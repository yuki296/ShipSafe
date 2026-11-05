import { useEffect, useRef, useState } from 'react';
import { HISTORY_KEY, readHistory, writeHistory, updateHistoryMetadata } from '../utils/history.js';
function storage() {
  try { return window.localStorage; } catch { return null; }
}
export default function useScanHistory() {
  const [state, setState] = useState(() => readHistory(storage()));
  const current = useRef(state.records);
  function commit(records) {
    const next = writeHistory(storage(), records);
    current.current = next.records;
    setState(next);
  }
  useEffect(() => {
    function sync(event) {
      if (event.key !== HISTORY_KEY && event.key !== null) return;
      const next = readHistory(storage());
      current.current = next.records;
      setState(next);
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return { ...state,
    add: (record) => commit([record, ...current.current]),
    update: (id, metadata) => commit(updateHistoryMetadata(current.current, id, metadata)),
    remove: (id) => commit(current.current.filter((row) => row.id !== id)),
    clear: () => commit([]),
  };
}
