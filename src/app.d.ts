import type { SessionPayload } from '$lib/server/session';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      accessToken?: string;
      session?: SessionPayload;
      user?: {
        email: string;
        storageUrl: string;
        permissions: string[];
        firestore: string;
        role: string;
      };
    }
    // interface PageData {}
    interface PageData {
      storageUrl?: string | null;
    }
    // interface Platform {}
  }
}

export {};
