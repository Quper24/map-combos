import { useEffect, useState } from 'react';
import { currentComboVersion, presetCombosByVersion } from '../data/builderCatalogs';
const files = import.meta.glob('../../content/combos/*.json', { import: 'default' });
const publishedPresets = presetCombosByVersion[currentComboVersion];
const loadArchive = files[`../../content/combos/v${currentComboVersion}.json`];
export default function useCurrentCombos() {
  const [records, setRecords] = useState(publishedPresets || []);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (publishedPresets || !loadArchive) return;
    let active = true;
    loadArchive()
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
  if (!publishedPresets && !loadArchive) throw new Error('Current combo data not found');
  return records;
}
