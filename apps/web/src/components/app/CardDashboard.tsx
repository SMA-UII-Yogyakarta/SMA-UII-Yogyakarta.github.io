import React, { useEffect, useState } from 'react';
import { apiFetch, getCachedData } from '../../lib/api-client';

interface Card {
  cardNumber: string;
  qrCode: string;
  issuedAt: number;
}

interface User {
  id?: string;
  name?: string;
  role?: string;
  status?: string;
  class?: string;
  nisn?: string | null;
}

interface CardDashboardProps {
  initialUser?: User | null;
  initialCard?: Card | null;
}

export default function CardDashboard({ initialUser, initialCard }: CardDashboardProps) {
  const cachedProfile = getCachedData<any>('/api/profile');
  const cachedUser: User | null = cachedProfile?.data ? { id: cachedProfile.data.id, name: cachedProfile.data.name, role: cachedProfile.data.role, status: cachedProfile.data.status, class: cachedProfile.data.class, nisn: cachedProfile.data.nisn } : null;
  const cachedCard: Card | null = cachedProfile?.data?.card ? { cardNumber: cachedProfile.data.card.cardNumber, qrCode: cachedProfile.data.card.qrCode || cachedProfile.data.cardQrCode, issuedAt: cachedProfile.data.card.issuedAt || cachedProfile.data.cardIssuedAt } : null;
  const [user, setUser] = useState<User | null>(cachedUser ?? initialUser ?? null);
  const [card, setCard] = useState<Card | null>(cachedCard ?? initialCard ?? null);
  const [loading, setLoading] = useState(!cachedUser && !initialUser && !cachedCard && !initialCard);
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [showPdfInstruction, setShowPdfInstruction] = useState(false);

  useEffect(() => {
    if (!initialUser || !initialCard) {
      loadCardData();
    } else {
      setLoading(false);
    }
  }, [initialUser, initialCard]);

  const loadCardData = async () => {
    if (!cachedProfile?.data) setLoading(true);
    try {
      const res = await apiFetch<any>('/api/profile');
      if (res.data) {
        setUser({
          id: res.data.id,
          name: res.data.name,
          role: res.data.role,
          status: res.data.status,
          class: res.data.class,
          nisn: res.data.nisn,
        });
        if (res.data.card) {
          setCard({
            cardNumber: res.data.card.cardNumber,
            qrCode: res.data.card.qrCode || res.data.cardQrCode,
            issuedAt: res.data.card.issuedAt || res.data.cardIssuedAt,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load card data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setShowPdfInstruction(true);
  };

  const startPrintAfterInstruction = () => {
    setShowPdfInstruction(false);
    window.print();
  };

  const fmtDate = (timestamp: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
        <div className="flex justify-center">
          <div className="w-full max-w-sm h-56 bg-gray-900 border border-gray-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!card || !user) {
    return (
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-bold text-gray-200 mb-1">Kartu Belum Tersedia</h3>
          <p className="text-gray-400 text-sm">Kartu anggota akan dibuat setelah akun disetujui.</p>
        </div>
      </div>
    );
  }

  const initial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <div>
      {/* Action Buttons in header space using standard markup style */}
      <div className="flex justify-end mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'card' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Kartu
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'qr' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              QR Code
            </button>
          </div>
          <button
            onClick={handlePrint}
            type="button"
            aria-label="Print"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            type="button"
            aria-label="Download as PDF"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-sm space-y-4">
          {/* Card visual */}
          <div
            id="panel-card"
            className={`${activeTab === 'card' ? 'block' : 'hidden print:block'} bg-linear-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden`}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs opacity-60">SMA UII Lab</p>
                  <p className="font-bold">Member Card</p>
                </div>
                <span className="text-2xl">⬡</span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-500/50 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg leading-tight truncate">{user.name}</p>
                  <p className="text-xs opacity-60">{user.class}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs opacity-60">Card Number</p>
                  <p className="font-mono text-sm font-bold truncate">{card.cardNumber}</p>
                </div>
                <div>
                  <p className="text-xs opacity-60">NISN</p>
                  <p className="font-mono text-sm truncate">{user.nisn || '-'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs opacity-60">Issued</p>
                  <p className="text-sm">{fmtDate(card.issuedAt)}</p>
                </div>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* QR Code visual */}
          <div
            id="panel-qr"
            className={`${activeTab === 'qr' ? 'block' : 'hidden print:block'} bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 text-center`}
          >
            <p className="text-sm font-medium mb-4 text-gray-200">QR Code Verifikasi</p>
            <div className="inline-block p-3 bg-white rounded-lg">
              <img src={card.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-xs text-gray-500 mt-3 print:hidden">Tunjukkan kode ini untuk verifikasi keanggotaan</p>
          </div>
        </div>
      </div>

      {/* PDF Instruction Modal Overlay */}
      {showPdfInstruction && (
        <div id="pdf-instruction" className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] print:hidden">
          <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 max-w-sm text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-bold mb-2 text-white">Simpan sebagai PDF</h3>
            <p className="text-gray-400 text-sm mb-4">Pilih "Save as PDF" atau "Simpan sebagai PDF" pada dialog print yang akan muncul.</p>
            <button
              onClick={startPrintAfterInstruction}
              className="bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white px-4 py-2 w-full transition-all duration-300"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* Print CSS styling injection */}
      <style>{`
        @media print {
          #sidebar,
          #topbar,
          #bottom-nav,
          .print\\:hidden,
          #pdf-instruction {
            display: none !important;
          }
          #main-content {
            margin-left: 0 !important;
          }
          #dashboard-content {
            padding: 0 !important;
            overflow: visible !important;
          }
          .flex.justify-center {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100vh !important;
            padding: 20px !important;
          }
          #panel-card,
          #panel-qr {
            width: 100% !important;
            max-width: 400px !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 2px solid #1e3a8a !important;
          }
          #panel-card {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
