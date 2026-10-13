import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Truck } from "lucide-react";
import { IcTruck } from "../../components/icons";
import { StatCard } from "../../components/shared/stat-card";

describe("shared icon presentation contracts", () => {
  it("renders both custom and Lucide stat icons with caller styles", () => {
    for (const icon of [IcTruck, Truck]) {
      const html = renderToStaticMarkup(createElement(StatCard, { title: "Test trips", value: 0, icon, iconColor: "text-blue-400", className: "test-card" }));
      expect(html).toContain("test-card");
      expect(html).toContain("h-5 w-5 text-blue-400");
      expect(html).toContain("Test trips");
      expect(html).not.toContain("text-foreground-muted");
    }
  });
  it("uses the existing muted icon style when no color is supplied", () => {
    expect(renderToStaticMarkup(createElement(StatCard, { title: "Trips", value: 0, icon: IcTruck }))).toContain("h-5 w-5 text-foreground-muted");
  });
  it("maps custom icon size to dimensions without leaking a size attribute", () => {
    const html = renderToStaticMarkup(createElement(IcTruck, { size: 18, className: "test-icon" }));
    expect(html).toContain('width="18"');
    expect(html).toContain('height="18"');
    expect(html).not.toContain('size="18"');
    expect(html).toContain('aria-hidden="true"');
  });
  it("preserves explicit dimensions and default em sizing", () => {
    const explicit = renderToStaticMarkup(createElement(IcTruck, { size: 18, width: 32, height: 24 }));
    expect(explicit).toContain('width="32"'); expect(explicit).toContain('height="24"');
    expect(renderToStaticMarkup(createElement(IcTruck))).toContain('width="1em"');
  });
});
