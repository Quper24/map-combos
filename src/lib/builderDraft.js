import { validateCatalog } from './comboBuilder.js';

export const builderDraftKey = 'quperSimulator_comboDraft';

export function readBuilderDraft() {
  try {
    const raw = localStorage.getItem(builderDraftKey);
    return raw ? validateCatalog(JSON.parse(raw), true) : null;
  } catch {
    return null;
  }
}
