import { useState, useEffect } from "react";
import { getStatusColor, getStatusLabel, getBookingDisplayStatus } from "@/lib/domain";
import type { Member } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X, QrCode, Nfc } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MyBookingsPage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();

  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelInProgress, setCancelInProgress] = useState(false);
  const [qrBookingId, setQrBookingId] = useState<string | null>(null);

  // Fetch current member from API
  useEffect(() => {
    if (!user) {
      setMemberLoading(false);
      return;
    }
    let cancelled = false;
    api.get<{ data: Member }>("/v1/members/me").then((res) => {
      if (!cancelled) setMember(res.data);
    }).catch(() => {
      if (!cancelled) setMember(null);
    }).finally(() => {
      if (!cancelled) setMemberLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const memberId = member?.id ?? "";
  const bookings = td.bookings.filter((b) => b.memberId === memberId);
  const cancellingBooking = cancellingId ? bookings.find((b) => b.id === cancellingId) : null;

  async function confirmCancel() {
    if (!cancellingId) return;
    setCancelInProgress(true);
    try {
      await api.delete(`/v1/bookings/${cancellingId}`);
      td.refetch();
    } catch {
      // Could add error toast here
    } finally {
      setCancelInProgress(false);
      setCancellingId(null);
    }
  }

  const bookingsWithDisplay = bookings.map((b) => ({ ...b, displayStatus: getBookingDisplayStatus(b) }));
  const active = bookingsWithDisplay.filter((b) => b.displayStatus === "confirmed" || b.displayStatus === "in_progress");
  const past = bookingsWithDisplay.filter((b) => b.displayStatus !== "confirmed" && b.displayStatus !== "in_progress");

  if (memberLoading || td.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>

      {/* Active (confirmed + in_progress) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Activas
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
            No tienes reservas activas
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((b) => {
              const isQrOpen = qrBookingId === b.id;
              const qrData = JSON.stringify({
                type: "ica-padel-checkin",
                bookingId: b.id,
                memberId: b.memberId,
                court: b.courtName,
                time: b.startTime,
              });
              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl border overflow-hidden ${
                    b.displayStatus === "in_progress" ? "border-amber-300 bg-amber-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{b.courtName}</p>
                        {b.displayStatus === "in_progress" && (
                          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            En curso
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(b.startTime).toLocaleDateString("es-PE", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        &middot;{" "}
                        {new Date(b.startTime).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        –
                        {new Date(b.endTime).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {b.creditsDeducted} creditos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQrBookingId(isQrOpen ? null : b.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isQrOpen
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title="Mostrar QR de check-in"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      {b.displayStatus === "confirmed" && (
                        <button
                          onClick={() => setCancellingId(b.id)}
                          className="text-sm text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR expandido */}
                  {isQrOpen && (
                    <div className="border-t border-gray-100 p-4 flex flex-col items-center gap-3 bg-gray-50/50">
                      <QRCodeSVG
                        value={qrData}
                        size={180}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#1e3a5f"
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Muestra este QR al staff para hacer check-in
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Nfc className="w-3 h-3" />
                        <span>Tambien compatible con RFID/NFC</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Historial
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
            Sin historial
          </p>
        ) : (
          <div className="space-y-2">
            {past.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{b.courtName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.startTime).toLocaleDateString("es-PE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    &middot;{" "}
                    {new Date(b.startTime).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    –
                    {new Date(b.endTime).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(b.displayStatus)}`}
                  >
                    {getStatusLabel(b.displayStatus)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog.Root open={!!cancellingId} onOpenChange={(open) => { if (!open) setCancellingId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Cancelar reserva
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Confirmar la cancelacion de la reserva
            </Dialog.Description>

            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                {cancellingBooking && (
                  <>
                    <p className="font-medium">
                      {cancellingBooking.courtName} &middot;{" "}
                      {new Date(cancellingBooking.startTime).toLocaleDateString("es-PE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {new Date(cancellingBooking.startTime).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1">
                      Esta accion no se puede deshacer. Se perderan <strong>{cancellingBooking.creditsDeducted} creditos</strong>.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Dialog.Close className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                No, mantener
              </Dialog.Close>
              <button
                onClick={confirmCancel}
                disabled={cancelInProgress}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelInProgress ? "Cancelando..." : "Si, cancelar"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
