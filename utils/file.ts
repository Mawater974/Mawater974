export function isFileOrBlob(value: any): value is File | Blob {
  return value instanceof File || value instanceof Blob;
}
