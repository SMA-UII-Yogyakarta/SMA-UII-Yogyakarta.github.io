/**
 * Member data returned from school data adapter.
 * This is the unified format that all adapters must return.
 */
export interface MemberData {
  found: boolean;
  nis: string;
  nisn: string | null;
  name: string;
  email: string;
  class: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  memberType: string | null;
  expireDate: string | null;
  isExpired: boolean;
  isPending: boolean;
}

/**
 * Search result for members.
 */
export interface MemberSearchResult {
  total: number;
  query: string;
  members: Array<{
    nis: string;
    name: string;
    email: string;
    memberType: string | null;
    isExpired: boolean;
  }>;
}

/**
 * Top visitor data for leaderboard.
 */
export interface TopVisitor {
  nis: string;
  name: string;
  visitCount: number;
}

/**
 * Configuration for adapters.
 */
export interface AdapterConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * SchoolDataAdapter - Abstraction layer for school data sources.
 * 
 * Implementations:
 * - SlimsAdapter: SLiMS 9.x plugin API
 * - AksesekolahAdapter: Aksesekolah.id API (future)
 * - MockAdapter: Development/testing mock data
 */
export interface SchoolDataAdapter {
  /** Name of the adapter for logging/debugging */
  readonly name: string;

  /** Verify a member by NIS (member ID) */
  verifyMember(nis: string): Promise<MemberData>;

  /** Search members by query (NIS, name, or email) */
  searchMembers(query: string, limit?: number): Promise<MemberSearchResult>;

  /** Get top visitors for leaderboard */
  getTopVisitors(limit?: number): Promise<TopVisitor[]>;

  /** Health check - returns true if the data source is available */
  healthCheck(): Promise<boolean>;
}
