import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import { getMemberByUserId } from "@/lib/mock-data";
import PadelIcon from "@/components/PadelIcon";

export default function MyQRPage() {
  const user = useAuthStore((s) => s.user);
  const branding = useBrandingStore((s) => s.branding);
  const member = user ? getMemberByUserId(user.id) : undefined;

  const qrData = JSON.stringify({
    type: "ica-padel-member",
    memberId: member?.id ?? "",
    name: user?.name ?? "",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] gap-6 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center w-full max-w-sm">
        {/* Club branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <PadelIcon className="w-4 h-4 text-blue-700" />
          </div>
          <span className="font-bold text-gray-900">{branding.clubName}</span>
        </div>

        {/* QR */}
        <div className="bg-white rounded-xl p-3 inline-block mb-5">
          <QRCodeSVG
            value={qrData}
            size={220}
            level="M"
            bgColor="#ffffff"
            fgColor="#1e3a5f"
          />
        </div>

        {/* Member info */}
        <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

        {member && (
          <div className="mt-4 bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-700">{member.creditBalance}</p>
            <p className="text-xs text-blue-600">creditos disponibles</p>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
        Muestra este codigo al staff del club para que carguen creditos a tu cuenta.
      </p>
    </div>
  );
}
