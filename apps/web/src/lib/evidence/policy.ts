export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

const FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

/** Metadata preflight only; upload remains disabled until private storage and scanning exist. */
export function validateEvidenceFileMetadata(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
    return 'File size must be between 1 byte and 5 MB.';
  }
  const extensions = FILE_TYPES[file.type];
  if (!extensions || !extensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    return 'Only PDF, PNG and JPEG files are supported.';
  }
  return null;
}

export function evidenceUploadAvailability(): 'disabled' {
  // A metadata check never makes a document safe. Enable only after private
  // storage, magic-byte inspection, malware scanning, retention and deletion.
  return 'disabled';
}
