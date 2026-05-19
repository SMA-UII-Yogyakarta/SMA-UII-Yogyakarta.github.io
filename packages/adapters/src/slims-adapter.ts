import type { SchoolDataAdapter, MemberData, MemberSearchResult, TopVisitor, AdapterConfig } from './types';

/**
 * SLiMS 9.x adapter - connects to SLiMS plugin REST API.
 * 
 * The plugin is installed at: /plugins/lab-digital-api/api.php
 * 
 * Endpoints:
 * - GET ?action=verify&nis={nis} - Verify member by NIS
 * - GET ?action=search&q={query}&limit={limit} - Search members
 * - GET ?action=top-visitors&limit={limit} - Get top visitors
 */
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

    const data = await res.json();

    if (!data.found) {
      return { found: false, nis, nisn: null, name: '', email: '', class: null, gender: null, birthDate: null, phone: null, memberType: null, expireDate: null, isExpired: false, isPending: false };
    }

    return {
      found: true,
      nis: data.nis,
      nisn: data.nisn ?? null,
      name: data.name,
      email: data.email,
      class: data.class ?? null,
      gender: data.gender ?? null,
      birthDate: data.birth_date ?? null,
      phone: data.phone ?? null,
      memberType: data.member_type ?? null,
      expireDate: data.expire_date ?? null,
      isExpired: data.is_expired,
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

    const data = await res.json();

    return {
      total: data.total,
      query: data.query,
      members: data.members.map((m: Record<string, unknown>) => ({
        nis: m.nis as string,
        name: m.name as string,
        email: m.email as string,
        memberType: m.member_type as string | null,
        isExpired: m.is_expired as boolean,
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

    const data = await res.json();

    return data.members.map((m: Record<string, unknown>) => ({
      nis: m.nis as string,
      name: m.name as string,
      visitCount: m.visit_count as number,
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
