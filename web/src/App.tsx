import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Layout from "@/components/Layout";

import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import CourtsPage from "@/pages/CourtsPage";
import CourtDetailPage from "@/pages/CourtDetailPage";
import BookingsPage from "@/pages/BookingsPage";
import MembersPage from "@/pages/MembersPage";
import CreditsPage from "@/pages/CreditsPage";
import BookCourtPage from "@/pages/BookCourtPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import BalancePage from "@/pages/BalancePage";
import MyQRPage from "@/pages/MyQRPage";
import PlatformPage from "@/pages/PlatformPage";
import BrandingPage from "@/pages/BrandingPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import MemberProfilePage from "@/pages/MemberProfilePage";
import SupportPage from "@/pages/SupportPage";
import TicketQueuePage from "@/pages/TicketQueuePage";
import OnboardingPage from "@/pages/OnboardingPage";
import ReportsPage from "@/pages/ReportsPage";
import CancellationPolicyPage from "@/pages/CancellationPolicyPage";
import SedesPage from "@/pages/SedesPage";
import BillingPage from "@/pages/BillingPage";
import MarketplacePage from "@/pages/MarketplacePage";
import ModuleConfigPage from "@/pages/ModuleConfigPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SignupPage from "@/pages/SignupPage";
import AgendaPage from "@/pages/AgendaPage";
import PeoplePage from "@/pages/PeoplePage";
import SchedulesPage from "@/pages/SchedulesPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RequirePlatformAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "platform_admin") return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "super_admin" && user.role !== "platform_admin") return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function RequireStaffOrAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "member") return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function RequireMember({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "member") return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function RootPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "platform_admin") return <Navigate to="/platform" replace />;
  if (user.role === "member") return <BookCourtPage />;
  return <HomePage />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<RequireAuth><RootPage /></RequireAuth>} />

        {/* Platform admin */}
        <Route path="/platform" element={<RequirePlatformAdmin><PlatformPage /></RequirePlatformAdmin>} />

        {/* Admin only */}
        <Route path="/dashboard" element={<RequireSuperAdmin><DashboardPage /></RequireSuperAdmin>} />
        <Route path="/branding" element={<RequireSuperAdmin><BrandingPage /></RequireSuperAdmin>} />

        {/* Platform admin extras */}
        <Route path="/tickets" element={<RequirePlatformAdmin><TicketQueuePage /></RequirePlatformAdmin>} />
        <Route path="/onboarding" element={<RequirePlatformAdmin><OnboardingPage /></RequirePlatformAdmin>} />

        {/* Billing & Marketplace — visible to platform admin AND club admin */}
        <Route path="/billing" element={<RequireSuperAdmin><BillingPage /></RequireSuperAdmin>} />
        <Route path="/marketplace" element={<RequireSuperAdmin><MarketplacePage /></RequireSuperAdmin>} />

        {/* Admin only extras */}
        <Route path="/people" element={<RequireSuperAdmin><PeoplePage /></RequireSuperAdmin>} />
        <Route path="/reports" element={<RequireSuperAdmin><ReportsPage /></RequireSuperAdmin>} />
        <Route path="/cancellation-policy" element={<RequireSuperAdmin><CancellationPolicyPage /></RequireSuperAdmin>} />
        <Route path="/sedes" element={<RequireSuperAdmin><SedesPage /></RequireSuperAdmin>} />

        {/* Admin + Staff */}
        <Route path="/modules/:id" element={<RequireStaffOrAdmin><ModuleConfigPage /></RequireStaffOrAdmin>} />
        <Route path="/schedules" element={<RequireStaffOrAdmin><SchedulesPage /></RequireStaffOrAdmin>} />
        <Route path="/agenda" element={<RequireStaffOrAdmin><AgendaPage /></RequireStaffOrAdmin>} />
        <Route path="/courts" element={<RequireStaffOrAdmin><CourtsPage /></RequireStaffOrAdmin>} />
        <Route path="/courts/:id" element={<RequireStaffOrAdmin><CourtDetailPage /></RequireStaffOrAdmin>} />
        <Route path="/bookings" element={<RequireStaffOrAdmin><BookingsPage /></RequireStaffOrAdmin>} />
        <Route path="/members" element={<RequireStaffOrAdmin><MembersPage /></RequireStaffOrAdmin>} />
        <Route path="/members/:id" element={<RequireStaffOrAdmin><MemberProfilePage /></RequireStaffOrAdmin>} />
        <Route path="/credits" element={<RequireStaffOrAdmin><CreditsPage /></RequireStaffOrAdmin>} />
        <Route path="/support" element={<RequireStaffOrAdmin><SupportPage /></RequireStaffOrAdmin>} />

        {/* Member only */}
        <Route path="/my-bookings" element={<RequireMember><MyBookingsPage /></RequireMember>} />
        <Route path="/balance" element={<RequireMember><BalancePage /></RequireMember>} />
        <Route path="/my-qr" element={<RequireMember><MyQRPage /></RequireMember>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
