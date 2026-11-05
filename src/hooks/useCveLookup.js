import { useRef, useState } from 'react';
import { getCveDetails, normalizeCveID } from '../services/cve.js';
export default function useCveLookup() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ loading: false, result: undefined, error: '', id: '' });
  const lock = useRef(false);
  async function lookup(value = query) {
    if (lock.current) return;
    let id;
    try { id = normalizeCveID(value); }
    catch (error) { setState({ loading: false, result: undefined, error: error.message, id: '' }); return; }
    setQuery(id); lock.current = true;
    setState({ loading: true, result: undefined, error: '', id });
    try { setState({ loading: false, result: await getCveDetails(id), error: '', id }); }
    catch (error) { setState({ loading: false, result: undefined, error: error.message, id }); }
    finally { lock.current = false; }
  }
  return { query, setQuery, ...state, lookup };
}
