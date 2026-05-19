export type { MemberData, MemberSearchResult, TopVisitor, AdapterConfig, SchoolDataAdapter } from './types';

export { MockAdapter } from './mock-adapter';
export { SlimsAdapter } from './slims-adapter';

export function createSchoolDataAdapter(env: {
  SLIMS_API_URL?: string;
  SLIMS_API_KEY?: string;
}): import('./types').SchoolDataAdapter {
  const { SlimsAdapter } = require('./slims-adapter');
  const { MockAdapter } = require('./mock-adapter');

  if (env.SLIMS_API_URL && env.SLIMS_API_KEY) {
    return new SlimsAdapter({
      apiUrl: env.SLIMS_API_URL,
      apiKey: env.SLIMS_API_KEY,
    });
  }

  console.warn('[adapters] SLIMS_API_URL not configured, using MockAdapter');
  return new MockAdapter();
}
