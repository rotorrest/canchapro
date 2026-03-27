export function renderSite(config: Record<string, unknown>): string {
  const c = {
    clubName: (config.clubName as string) ?? "Club",
    primaryColor: (config.primaryColor as string) ?? "#1d5092",
    logoUrl: config.logoUrl as string | null,
    heroTitle: (config.heroTitle as string) ?? "",
    heroSubtitle: (config.heroSubtitle as string) ?? "",
    address: (config.address as string) ?? "",
    phone: (config.phone as string) ?? "",
    instagram: (config.instagram as string) ?? "",
    hours: (config.hours as string) ?? "",
    photos: (config.photos as string[]) ?? [],
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.clubName}</title>
  <meta name="description" content="${c.heroSubtitle}">
  <meta property="og:title" content="${c.clubName}">
  <meta property="og:description" content="${c.heroSubtitle}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { brand: "${c.primaryColor}" } } }
    }
  </script>
</head>
<body class="bg-white">
  <!-- Hero -->
  <section class="relative bg-brand text-white">
    <div class="max-w-5xl mx-auto px-5 py-20 text-center">
      ${c.logoUrl ? `<img src="${c.logoUrl}" alt="${c.clubName}" class="w-20 h-20 mx-auto mb-6 rounded-2xl">` : ""}
      <h1 class="text-4xl sm:text-5xl font-bold">${c.heroTitle || c.clubName}</h1>
      ${c.heroSubtitle ? `<p class="mt-4 text-xl text-white/80">${c.heroSubtitle}</p>` : ""}
      <a href="/app" class="mt-8 inline-block bg-white text-brand font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors">
        Reservar cancha
      </a>
    </div>
  </section>

  <!-- Info -->
  <section class="max-w-4xl mx-auto px-5 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
    ${c.hours ? `
    <div>
      <h3 class="font-semibold text-gray-900 mb-2">Horarios</h3>
      <p class="text-gray-600 text-sm whitespace-pre-line">${c.hours}</p>
    </div>` : ""}
    ${c.address ? `
    <div>
      <h3 class="font-semibold text-gray-900 mb-2">Ubicacion</h3>
      <p class="text-gray-600 text-sm">${c.address}</p>
    </div>` : ""}
    <div>
      ${c.phone ? `<h3 class="font-semibold text-gray-900 mb-2">Contacto</h3><p class="text-gray-600 text-sm">${c.phone}</p>` : ""}
      ${c.instagram ? `<p class="text-gray-600 text-sm mt-1"><a href="https://instagram.com/${c.instagram.replace("@", "")}" class="text-brand hover:underline">${c.instagram}</a></p>` : ""}
    </div>
  </section>

  ${c.photos.length > 0 ? `
  <!-- Photos -->
  <section class="max-w-5xl mx-auto px-5 pb-16">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      ${c.photos.map((p: string) => `<img src="${p}" alt="${c.clubName}" class="rounded-xl w-full h-48 object-cover">`).join("\\n      ")}
    </div>
  </section>` : ""}

  <!-- Footer -->
  <footer class="border-t border-gray-100 py-8 text-center">
    <p class="text-sm text-gray-400">${c.clubName} &middot; Powered by CanchaPro</p>
  </footer>
</body>
</html>`;
}
