export interface ImageFile {
  preview: string;
  isMain: boolean;
  id: string;
  type: 'new' | 'existing';
  raw: File;
  name: string;
  size: number;
  lastModified: number;
  thumbnailUrl?: string;
  thumbnailRaw?: File;
  originalName?: string;
}
