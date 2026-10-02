import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hotels-vendors.com";

  const routes = [
    "",
    "/about",
    "/solutions",
    "/pricing",
    "/marketplace",
    "/become-supplier",
    "/social-media",
    "/login",
    "/register",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/marketplace" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/marketplace" ? 0.9 : 0.7,
  }));
}
