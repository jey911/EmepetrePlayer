/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module 'music-metadata-browser' {
  export function parseBlob(blob: Blob): Promise<{
    common: {
      title?: string;
      artist?: string;
      album?: string;
      genre?: string[];
      year?: number;
      track?: { no: number | null };
      picture?: Array<{
        data: Uint8Array;
        format: string;
        type?: string;
      }>;
    };
    format: {
      duration?: number;
      bitrate?: number;
      sampleRate?: number;
      codec?: string;
    };
  }>;
}
