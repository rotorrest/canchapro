import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://canchapro.app";
const TITLE = "CanchaPro — Sistema de gestion para clubes y complejos deportivos";
const DESCRIPTION =
  "Administra reservas, socios, cobros y operacion de tus canchas desde una sola plataforma. Para voley, basquet, padel, tenis, futbol, squash y mas.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | CanchaPro",
  },
  description: DESCRIPTION,
  keywords: [
    "sistema reservas canchas",
    "software club deportivo",
    "gestion complejo deportivo",
    "reservas canchas voley",
    "reservas canchas futbol",
    "reservas canchas tenis",
    "reservas canchas padel",
    "reservas canchas basquet",
    "reservas canchas squash",
    "administracion canchas",
    "cobros club deportivo",
    "SaaS deportivo",
    "gestion socios club",
    "software canchas Peru",
    "sistema operativo club deportivo",
  ],
  authors: [{ name: "Lumini", url: "https://lumini.dev" }],
  creator: "Lumini",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: "CanchaPro",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CanchaPro — Sistema de gestion para clubes y complejos deportivos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CanchaPro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: DESCRIPTION,
    url: SITE_URL,
    author: { "@type": "Organization", name: "Lumini", url: "https://lumini.dev" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Prueba gratuita de 14 dias" },
  };

  return (
    <html lang="es">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
