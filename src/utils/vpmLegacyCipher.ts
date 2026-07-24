/**
 * VPM Legacy Custom Matrix Cipher Engine
 * Transcribed and enhanced from original prototype source code.
 * Variable Polymorphic Phase Matrix Cipher logic for educational/compatibility comparison.
 */

export interface VpmShiftStep {
  char: string;
  ascii: number;
  keyChar: string;
  keyAscii: number;
  dynamicPhase: number;
  originalAscii: number;
  shiftedAscii: number;
  resultingChar: string;
}

export function vpmCipher(input: string, key: string, invert: boolean = false): string {
  if (!input || !key) return '';

  const keyShifts: number[] = [];
  for (let i = 0; i < key.length; i++) {
    keyShifts.push(key.charCodeAt(i));
  }

  let result = '';
  for (let i = 0; i < input.length; i++) {
    let charCode = input.charCodeAt(i);

    // Standard printable ASCII 32 (' ') to 126 ('~')
    if (charCode >= 32 && charCode <= 126) {
      const currentShift = keyShifts[i % keyShifts.length];
      const dynamicPhase = (currentShift + i) % 95;

      if (invert) {
        charCode = charCode - dynamicPhase;
        if (charCode < 32) charCode += 95;
      } else {
        charCode = charCode + dynamicPhase;
        if (charCode > 126) charCode -= 95;
      }
    }
    result += String.fromCharCode(charCode);
  }
  return result;
}

export function vpmEncryptLegacy(plaintext: string, key: string): { ciphertextB64: string; steps: VpmShiftStep[] } {
  if (!plaintext || !key) return { ciphertextB64: '', steps: [] };

  const rawCipher = vpmCipher(plaintext, key, false);
  const ciphertextB64 = btoa(unescape(encodeURIComponent(rawCipher)));

  // Generate step-by-step visual matrix trace for up to 50 characters
  const steps: VpmShiftStep[] = [];
  const keyShifts: number[] = Array.from(key).map(c => c.charCodeAt(0));

  for (let i = 0; i < Math.min(plaintext.length, 50); i++) {
    const char = plaintext[i];
    const origAscii = char.charCodeAt(0);
    const keyChar = key[i % key.length];
    const keyAscii = keyChar.charCodeAt(0);

    let shiftedAscii = origAscii;
    let dynamicPhase = 0;

    if (origAscii >= 32 && origAscii <= 126) {
      dynamicPhase = (keyAscii + i) % 95;
      shiftedAscii = origAscii + dynamicPhase;
      if (shiftedAscii > 126) shiftedAscii -= 95;
    }

    steps.push({
      char,
      ascii: origAscii,
      keyChar,
      keyAscii,
      dynamicPhase,
      originalAscii: origAscii,
      shiftedAscii,
      resultingChar: String.fromCharCode(shiftedAscii),
    });
  }

  return { ciphertextB64, steps };
}

export function vpmDecryptLegacy(ciphertextB64: string, key: string): string {
  if (!ciphertextB64 || !key) return '';

  try {
    const rawCipher = decodeURIComponent(escape(atob(ciphertextB64.trim())));
    return vpmCipher(rawCipher, key, true);
  } catch (err) {
    throw new Error('Invalid VPM Base64 payload or corrupted ciphertext string.');
  }
}
