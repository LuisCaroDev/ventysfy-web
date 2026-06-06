import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    storageUrl: locals.user?.storageUrl ?? null,
  };
};
