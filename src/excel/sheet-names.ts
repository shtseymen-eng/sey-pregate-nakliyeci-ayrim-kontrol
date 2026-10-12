const INVALID_SHEET_CHARACTERS = /[\\/*?:[\]]/g;

export function makeUniqueSheetName(
  rank: number,
  carrier: string,
  usedNames: Set<string>,
): string {
  const cleaned = carrier
    .replace(INVALID_SHEET_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .replace(/^'+|'+$/g, "")
    .trim() || "Nakliyeci";
  const prefix = `${rank}. `;
  const base = `${prefix}${cleaned}`.slice(0, 31).trimEnd();
  let candidate = base;
  let suffixNumber = 2;
  const normalizedUsed = new Set([...usedNames].map((name) => name.toLocaleLowerCase("tr-TR")));
  while (normalizedUsed.has(candidate.toLocaleLowerCase("tr-TR"))) {
    const suffix = `~${suffixNumber}`;
    candidate = `${base.slice(0, 31 - suffix.length).trimEnd()}${suffix}`;
    suffixNumber += 1;
  }
  usedNames.add(candidate);
  return candidate;
}
