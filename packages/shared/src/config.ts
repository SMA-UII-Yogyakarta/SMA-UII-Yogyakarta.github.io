export const DEFAULT_CONFIG = {
  site: {
    name: "SMA UII Lab",
    description: "Ruang eksplorasi digital buat yang suka ngulik teknologi",
    themeColor: "#3b82f6",
    logoSymbol: "⬡"
  },
  institution: {
    name: "SMA Universitas Islam Indonesia Yogyakarta",
    shortName: "SMA UII",
    location: "Yogyakarta",
    website: "https://smauiiyk.sch.id"
  },
  deployment: {
    domain: "lab.smauiiyk.sch.id",
    repository: "https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io"
  },
  socials: {
    github: "https://github.com/SMA-UII-Yogyakarta",
    maintainerGithub: "https://github.com/sandikodev"
  },
  features: {
    slimsIntegration: true,
    birthdayEvents: true
  }
};

/**
 * In a real universal deployment, this would be loaded from a JSON file
 * or environment variables. For now, we provide this as a central source of truth.
 */
export const getSiteConfig = () => {
  // If we were in a Node environment, we could read a JSON file here.
  // In Astro/Browser, we might use import.meta.env or a bundled JSON.
  return DEFAULT_CONFIG;
};

export type SiteConfig = typeof DEFAULT_CONFIG;
