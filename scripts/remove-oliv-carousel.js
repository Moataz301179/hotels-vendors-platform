/**
 * Remove OlivAdCarousel import and JSX block from page.tsx.
 * File is 1005 lines, ~61KB.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pagePath = path.join(__dirname, "../app/(marketing)/page.tsx");
let content = fs.readFileSync(pagePath, "utf8");

let changed = false;

// 1. Remove OlivAdCarousel import line if present
if (content.includes("import { OlivAdCarousel }")) {
  content = content.replace(
    /import \{\s*OlivAdCarousel\s*\} from "@\/components\/marketing\/oliv-ad-carousel";\n/,
    ""
  );
  changed = true;
  console.log("1. Removed OlivAdCarousel import");
}

// 2. Remove the OlivAdCarousel JSX block (comment + div wrapper)
const olivBlock = `          {/* Right: Oliv Ad Carousel (replaces hero image) */}
          <div className="mt-12 lg:mt-0 animate-fade-in-up animation-delay-200">
            <OlivAdCarousel />
          </div>
        </div>
      </div>

        {/* ═══════════ HERO IMAGE`;

const heroImageBlock = `        </div>
      </div>

        {/* ═══════════ HERO IMAGE`;

if (content.includes(olivBlock)) {
  content = content.replace(olivBlock, heroImageBlock);
  changed = true;
  console.log("2. Removed OlivAdCarousel JSX block");
} else {
  console.log("2. OlivAdCarousel JSX block not found (may already be removed)");
}

if (changed) {
  fs.writeFileSync(pagePath, content);
  console.log(`\nFile updated: ${pagePath}`);
  console.log(`New size: ${content.length} bytes`);
} else {
  console.log("\nNo changes needed.");
}
