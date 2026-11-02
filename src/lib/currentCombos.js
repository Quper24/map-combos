import { useEffect, useState } from 'react';
import site from '../../content/site.json';
const files = import.meta.glob('../../content/combos/*.json', { import: 'default' });
export default function useCurrentCombos() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const load = files[`../../content/combos/v${site.currentGameVersion}.json`];
    if (!load) {
      setError(new Error('Current combo data not found'));
      return;
    }
    load()
      .then((value) => {
        if (active) setRecords(value);
      })
      .catch((reason) => {
        if (active) setError(reason);
      });
    return () => {
      active = false;
    };
  }, []);
  if (error) throw error;
  return records;
}
