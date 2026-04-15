import { useState } from 'react';
import type { User, MemberCard } from '@db/schema';

interface MemberCardProps {
  user: User;
  card: MemberCard;
}

export default function MemberCardComponent({ user, card }: MemberCardProps) {
  const [downloading, setDownloading] = useState(false);

  const downloadCard = () => {
    setDownloading(true);
    // Create a canvas and draw the card
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 500);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);

    // Card content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('SMA UII LAB', 40, 60);
    
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Developer Foundation', 40, 90);

    // Member info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(user.name, 40, 200);
    
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(user.class, 40, 240);
    ctx.fillText(`NIS: ${user.nis}`, 40, 280);
    
    // Card number
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(card.cardNumber, 40, 440);

    // QR Code (simplified - in production use actual QR)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(600, 150, 150, 150);
    
    // Add QR code image if available
    if (card.qrCode) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 600, 150, 150, 150);
        downloadImage();
      };
      img.src = card.qrCode;
    } else {
      downloadImage();
    }

    function downloadImage() {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `smauii-lab-card-${user.nis}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setDownloading(false);
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card Preview */}
      <div className="relative aspect-8/5 bg-linear-to-br from-blue-900 to-purple-700 rounded-2xl p-8 text-white shadow-2xl mb-6">
        <div className="absolute top-8 left-8">
          <h3 className="text-2xl font-bold mb-1">SMA UII LAB</h3>
          <p className="text-sm text-blue-200">Developer Foundation</p>
        </div>

        <div className="absolute bottom-24 left-8">
          <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
          <p className="text-lg text-gray-200">{user.class}</p>
          <p className="text-sm text-gray-300">NIS: {user.nis}</p>
        </div>

        <div className="absolute bottom-8 left-8">
          <p className="text-lg font-mono font-bold text-blue-300">{card.cardNumber}</p>
        </div>

        {/* QR Code */}
        <div className="absolute top-1/2 right-8 -translate-y-1/2 bg-white p-3 rounded-lg">
          {card.qrCode ? (
            <img src={card.qrCode} alt="QR Code" className="w-32 h-32" />
          ) : (
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
              QR Code
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-8 right-8">
          <span className="bg-green-500/20 border border-green-500/40 text-green-300 text-xs px-3 py-1 rounded-full">
            ✓ Active
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          {downloading ? 'Mengunduh...' : '📥 Download Kartu'}
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 border border-gray-700 hover:border-blue-500 px-6 py-3 rounded-lg font-semibold transition"
        >
          🖨️ Print Kartu
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <p className="mb-2">
          <strong className="text-white">Kartu Anggota Digital</strong> ini adalah bukti keanggotaanmu di SMA UII Lab.
        </p>
        <ul className="space-y-1 text-xs">
          <li>• Gunakan untuk akses ke event dan workshop</li>
          <li>• QR code untuk check-in attendance</li>
          <li>• Simpan di wallet digital atau print</li>
        </ul>
      </div>
    </div>
  );
}
