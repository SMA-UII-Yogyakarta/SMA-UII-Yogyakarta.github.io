import type { SchoolDataAdapter, AdapterConfig } from './types';
import { MockAdapter } from './mock-adapter';
import { SlimsAdapter } from './slims-adapter';

export type { MemberData, MemberSearchResult, TopVisitor, AdapterConfig, SchoolDataAdapter } from './types';

export { MockAdapter, SlimsAdapter };

export function createSchoolDataAdapter(env: {
  SLIMS_API_URL?: string;
  SLIMS_API_KEY?: string;
}): SchoolDataAdapter {
  if (env.SLIMS_API_URL && env.SLIMS_API_KEY) {
    return new SlimsAdapter({
      apiUrl: env.SLIMS_API_URL,
      apiKey: env.SLIMS_API_KEY,
    });
  }

  return new MockAdapter();
}
