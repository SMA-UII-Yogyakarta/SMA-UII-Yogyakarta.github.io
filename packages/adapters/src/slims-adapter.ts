import type { SchoolDataAdapter, MemberData, MemberSearchResult, TopVisitor, AdapterConfig } from './types';

interface SlimsVerifyResponse {
  found: boolean;
  nis?: string;
  nisn?: string | null;
  name?: string;
  email?: string;
  class?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  member_type?: string | null;
  expire_date?: string | null;
  is_expired?: boolean;
  is_pending?: boolean;
}

interface SlimsSearchResponse {
  total: number;
  query: string;
  members: Array<{
    nis: string;
    name: string;
    email: string;
    member_type?: string | null;
    is_expired: boolean;
  }>;
}

interface SlimsTopVisitorsResponse {
  members: Array<{
    nis: string;
    name: string;
    visit_count: number;
  }>;
}

export class SlimsAdapter implements SchoolDataAdapter {
  readonly name = 'slims';
  
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: AdapterConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 5000;
  }

  async verifyMember(nis: string): Promise<MemberData> {
    const url = `${this.apiUrl}/api.php?action=verify&nis=${encodeURIComponent(nis)}`;
    
    const res = await fetch(url, {
      headers: { 'X-Lab-API-Key': this.apiKey },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (res.status === 404) {
      return { found: false, nis, nisn: null, name: '', email: '', class: null, gender: null, birthDate: null, phone: null, memberType: null, expireDate: null, isExpired: false, isPending: false };
    }

    if (!res.ok) {
      throw new Error(`SLiMS API error: ${res.status}`);
    }

    const data: SlimsVerifyResponse = await res.json();

    if (!data.found) {
      return { found: false, nis, nisn: null, name: '', email: '', class: null, gender: null, birthDate: null, phone: null, memberType: null, expireDate: null, isExpired: false, isPending: false };
    }

    return {
      found: true,
      nis: data.nis ?? nis,
      nisn: data.nisn ?? null,
      name: data.name ?? '',
      email: data.email ?? '',
      class: data.class ?? null,
      gender: data.gender ?? null,
      birthDate: data.birth_date ?? null,
      phone: data.phone ?? null,
      memberType: data.member_type ?? null,
      expireDate: data.expire_date ?? null,
      isExpired: data.is_expired ?? false,
      isPending: data.is_pending ?? false,
    };
  }

  async searchMembers(query: string, limit = 20): Promise<MemberSearchResult> {
    const url = `${this.apiUrl}/api.php?action=search&q=${encodeURIComponent(query)}&limit=${limit}`;
    
    const res = await fetch(url, {
      headers: { 'X-Lab-API-Key': this.apiKey },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!res.ok) {
      throw new Error(`SLiMS API error: ${res.status}`);
    }

    const data: SlimsSearchResponse = await res.json();

    return {
      total: data.total,
      query: data.query,
      members: data.members.map(m => ({
        nis: m.nis,
        name: m.name,
        email: m.email,
        memberType: m.member_type ?? null,
        isExpired: m.is_expired,
      })),
    };
  }

  async getTopVisitors(limit = 10): Promise<TopVisitor[]> {
    const url = `${this.apiUrl}/api.php?action=top-visitors&limit=${limit}`;
    
    const res = await fetch(url, {
      headers: { 'X-Lab-API-Key': this.apiKey },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!res.ok) {
      throw new Error(`SLiMS API error: ${res.status}`);
    }

    const data: SlimsTopVisitorsResponse = await res.json();

    return data.members.map(m => ({
      nis: m.nis,
      name: m.name,
      visitCount: m.visit_count,
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/api.php?action=health`, {
        headers: { 'X-Lab-API-Key': this.apiKey },
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
