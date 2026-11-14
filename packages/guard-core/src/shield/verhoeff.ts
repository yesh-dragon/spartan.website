const D_TABLE: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const P_TABLE: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const INV_TABLE: readonly number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** Validates a numeric string with the Verhoeff dihedral D5 checksum. */
export function verhoeffValidate(input: string): boolean {
  if (!/^\d+$/.test(input)) return false;
  let c = 0;
  const len = input.length;
  for (let i = 0; i < len; i++) {
    const digit = input.charCodeAt(len - 1 - i) - 48;
    c = D_TABLE[c][P_TABLE[i % 8][digit]];
  }
  return c === 0;
}

/** Computes the Verhoeff check digit for a numeric prefix string. */
export function verhoeffComputeCheckDigit(prefix: string): number {
  if (!/^\d+$/.test(prefix)) {
    throw new Error("verhoeffComputeCheckDigit requires numeric input");
  }
  let c = 0;
  const len = prefix.length;
  for (let i = 0; i < len; i++) {
    const digit = prefix.charCodeAt(len - 1 - i) - 48;
    c = D_TABLE[c][P_TABLE[(i + 1) % 8][digit]];
  }
  return INV_TABLE[c];
}

