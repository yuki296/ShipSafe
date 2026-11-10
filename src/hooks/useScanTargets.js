import { useRef, useState } from 'react';
import { addTarget, updateTarget, deleteTarget } from '../utils/targets.js';
// 검사 전 임시 목록. localStorage/DB에 저장하지 않는다.
export default function useScanTargets() {
  const [records, setRecords] = useState([]);
  const current = useRef([]);
  function commit(next) { current.current = next; setRecords(next); }
  return { records,
    add: (input) => commit(addTarget(current.current, input)),
    update: (id, input) => commit(updateTarget(current.current, id, input)),
    remove: (id) => commit(deleteTarget(current.current, id)),
  };
}
