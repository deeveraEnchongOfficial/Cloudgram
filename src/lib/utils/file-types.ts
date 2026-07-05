export type FileTypeCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'archive'
  | 'text'
  | 'spreadsheet'
  | 'presentation'
  | 'code'
  | 'other';

const MIME_MAP: Record<string, FileTypeCategory> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/x-matroska': 'video',
  'video/x-msvideo': 'video',
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
  'audio/x-m4a': 'audio',
  'application/pdf': 'pdf',
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/x-tar': 'archive',
  'application/gzip': 'archive',
  'text/plain': 'text',
  'text/csv': 'text',
  'text/markdown': 'text',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-powerpoint': 'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
  'text/javascript': 'code',
  'text/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java': 'code',
  'text/x-c': 'code',
  'text/x-cpp': 'code',
  'text/x-rust': 'code',
  'text/x-go': 'code',
  'text/html': 'code',
  'text/css': 'code',
  'application/json': 'code',
  'application/xml': 'code',
};

const EXT_MAP: Record<string, FileTypeCategory> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  tiff: 'image',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mkv: 'video',
  avi: 'video',
  mp3: 'audio',
  ogg: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  m4a: 'audio',
  pdf: 'pdf',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  txt: 'text',
  csv: 'text',
  md: 'text',
  doc: 'document',
  docx: 'document',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  js: 'code',
  ts: 'code',
  tsx: 'code',
  jsx: 'code',
  py: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  rs: 'code',
  go: 'code',
  html: 'code',
  css: 'code',
  json: 'code',
  xml: 'code',
};

export function getFileType(mimeType?: string | null, fileName?: string): FileTypeCategory {
  if (mimeType && MIME_MAP[mimeType]) return MIME_MAP[mimeType];
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
  }
  return 'other';
}

export function isImage(mimeType?: string | null, fileName?: string): boolean {
  return getFileType(mimeType, fileName) === 'image';
}

export function isVideo(mimeType?: string | null, fileName?: string): boolean {
  return getFileType(mimeType, fileName) === 'video';
}

export function isAudio(mimeType?: string | null, fileName?: string): boolean {
  return getFileType(mimeType, fileName) === 'audio';
}

export function isPdf(mimeType?: string | null, fileName?: string): boolean {
  return getFileType(mimeType, fileName) === 'pdf';
}

export function isPreviewable(mimeType?: string | null, fileName?: string): boolean {
  const cat = getFileType(mimeType, fileName);
  return cat === 'image' || cat === 'video' || cat === 'audio' || cat === 'pdf';
}
