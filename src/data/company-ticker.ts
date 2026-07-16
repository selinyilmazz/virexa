export type CompanyTickerItem = {
  name: string;
  summary: string;
  logo: string;
  logoBg: string;
};

export const companyTickerItems: CompanyTickerItem[] = [
  {
    name: "NVIDIA",
    summary: "AI demand reaches record levels",
    logo: "/logos/nvidia.svg",
    logoBg: "#0a0a0a",
  },
  {
    name: "Apple",
    summary: "New AI-powered health features",
    logo: "/logos/apple.svg",
    logoBg: "#ffffff",
  },
  {
    name: "Tesla",
    summary: "Model 2 officially unveiled",
    logo: "/logos/tesla.svg",
    logoBg: "#ffffff",
  },
  {
    name: "NASA",
    summary: "New exoplanet discovered",
    logo: "/logos/nasa.svg",
    logoBg: "#ffffff",
  },
  {
    name: "Microsoft",
    summary: "Invests $10B in AI",
    logo: "/logos/microsoft.svg",
    logoBg: "#ffffff",
  },
];
