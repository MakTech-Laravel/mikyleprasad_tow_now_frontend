import { request } from '@/api/request';

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function filenameFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop();
    if (base && base.includes('.')) {
      return base;
    }
  } catch {
    // ignore invalid URL
  }

  return fallback;
}

export async function downloadAuthenticatedFile(path: string, filename: string): Promise<void> {
  const response = await request.get(path, { responseType: 'blob' });
  const blob = response.data as Blob;
  triggerBlobDownload(blob, filename);
}
