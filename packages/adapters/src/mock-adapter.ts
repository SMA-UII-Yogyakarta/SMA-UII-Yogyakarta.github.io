import type { SchoolDataAdapter, MemberData, MemberSearchResult, TopVisitor } from './types';

/**
 * Mock adapter for development and testing.
 * Returns hardcoded data matching the SLiMS plugin response format.
 */
export class MockAdapter implements SchoolDataAdapter {
  readonly name = 'mock';

  // Mock data matching SLiMS SMA UII members
  private readonly members: Array<{
    nis: string;
    name: string;
    email: string;
    expiredAt: string;
    isPending: boolean;
  }> = [
    { nis: '1724', name: 'ALPIS GELIRIS TARI', email: '1724@students.smauiiyk.sch.id', expiredAt: '2026-08-12', isPending: false },
    { nis: '1751', name: 'ARIF MUHAMMAD MUNIF', email: '1751@students.smauiiyk.sch.id', expiredAt: '2026-08-12', isPending: false },
    { nis: '1725', name: 'ATFAL MAULANA YULIANTO', email: '1725@students.smauiiyk.sch.id', expiredAt: '2026-08-12', isPending: false },
    { nis: '1739', name: 'DEVITASARI', email: '1739@students.smauiiyk.sch.id', expiredAt: '2026-08-12', isPending: false },
    { nis: '1738', name: 'DIANA ARI MINARSIH', email: '1738@students.smauiiyk.sch.id', expiredAt: '2026-08-12', isPending: false },
    { nis: '1763', name: 'AHMAD ZIDAN', email: '1763@students.smauiiyk.sch.id', expiredAt: '2024-03-27', isPending: false },
    { nis: '1800', name: 'ACHMAD KHASAN NURWAHIDIN', email: '1800@students.smauiiyk.sch.id', expiredAt: '2024-03-27', isPending: false },
    { nis: '1812', name: 'ABDUL RAHIM ABUBAKAR', email: '1812@students.smauiiyk.sch.id', expiredAt: '2024-03-27', isPending: false },
  ];

  async verifyMember(nis: string): Promise<MemberData> {
    const member = this.members.find(m => m.nis === nis);
    
    if (!member) {
      return { found: false, nis, nisn: null, name: '', email: '', class: null, gender: null, birthDate: null, phone: null, memberType: null, expireDate: null, isExpired: false, isPending: false };
    }

    const expireDate = new Date(member.expiredAt);
    const isExpired = expireDate < new Date();

    return {
      found: true,
      nis: member.nis,
      nisn: null, // SLiMS doesn't have NISN
      name: member.name,
      email: member.email,
      class: null, // SLiMS doesn't have class data
      gender: null,
      birthDate: null,
      phone: null,
      memberType: 'Siswa',
      expireDate: member.expiredAt,
      isExpired,
      isPending: member.isPending,
    };
  }

  async searchMembers(query: string, limit = 20): Promise<MemberSearchResult> {
    const q = query.toLowerCase();
    const matches = this.members
      .filter(m => 
        m.nis.includes(q) || 
        m.name.toLowerCase().includes(q) || 
        m.email.toLowerCase().includes(q)
      )
      .slice(0, limit);

    return {
      total: matches.length,
      query,
      members: matches.map(m => ({
        nis: m.nis,
        name: m.name,
        email: m.email,
        memberType: 'Siswa',
        isExpired: new Date(m.expiredAt) < new Date(),
      })),
    };
  }

  async getTopVisitors(limit = 10): Promise<TopVisitor[]> {
    // Return mock top visitors
    return this.members.slice(0, limit).map((m, i) => ({
      nis: m.nis,
      name: m.name,
      visitCount: 100 - i * 10,
    }));
  }

  async healthCheck(): Promise<boolean> {
    return true; // Mock is always healthy
  }
}
