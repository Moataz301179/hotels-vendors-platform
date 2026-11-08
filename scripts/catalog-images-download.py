#!/usr/bin/env python3
"""Wikimedia Commons image picker + downloader for the 94 Egyptian-market products."""
import json, urllib.request, urllib.parse, os, sys
from PIL import Image

UA = "Hermes-Agent/1.0 (hotels-vendors catalog import; support@hotelsvendors.com)"
HEADERS = {"User-Agent": UA}
WIKI_URL = "https://commons.wikimedia.org/w/api.php"
OUT_DIR = "/Users/Moatazi/hotels-vendors-new/data/catalog-images"
os.makedirs(OUT_DIR, exist_ok=True)

def commons_search(query, limit=6):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": query, "gsrnamespace": 6, "gsrlimit": limit, "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 640,
    }
    req = urllib.request.Request(WIKI_URL + "?" + urllib.parse.urlencode(params), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)

def pick_best(pages, product_name, category):
    scored = []
    name_l = " ".join(str(product_name).split()).lower()
    cat_l = " ".join(str(category).split()).lower()
    for p in pages:
        ii = p.get("imageinfo", [{}])[0]
        title = p.get("title", "")
        mime = ii.get("mime", "")
        w = ii.get("thumbwidth") or ii.get("width") or 0
        h = ii.get("thumbheight") or ii.get("height") or 0
        thumb = ii.get("thumburl") or ii.get("url")
        score = 0
        t = title.lower()
        if name_l and name_l in t:
            score += 100
        # exact-ish title keywords
        if any(k in t for k in name_l.split()):
            score += 25
        if any(k in t for k in cat_l.split()):
            score += 15
        if mime == "image/jpeg" and w >= 480 and h >= 320:
            score += 20
        # disfavor generic crowd/portrait shots unless strongly matched
        if score < 30 and ("market" in t or "family" in t or "portrait" in t or "meal" in t):
            score -= 20
        if score > 0:
            scored.append((score, title, thumb, mime, w, h))
    scored.sort(key=lambda x: -x[0])
    return scored

def download(url, timeout=40):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def main():
    d = json.load(open("/Users/Moatazi/hotels-vendors-new/data/egyptian-market-v2.json"))
    products = d["product_catalog"]
    # category -> keyword hints for better search relevance
    CAT_KEYWORDS = {
        "poultry": "chicken", "dairy": "milk", "fresh_produce": "vegetable",
        "oils": "oil", "seafood": "fish", "meat": "beef", "bread": "bread",
        "bakery": "bread", "beverages": "drink", "canned_goods": "canned",
        "confectionery": "chocolate", "dates": "date fruit", "linens": "linen",
        "amenities": "towel", "ceramics": "plate", "glassware": "glass",
        "household": "kitchen", "cold_storage": "frozen", "logistics": "truck",
        "building_materials": "tile", "electronics": "light bulb", "carpets": "rug",
        "pharmaceuticals": "medicine", "cleaning": "cleaning", "packaging": "bag",
        "uniforms": "uniform", "spices": "spice", "handicrafts": "craft", "furniture": "chair",
    }
    results = []
    for i, p in enumerate(products, 1):
        name = p["name"]
        cat = p["category"]
        sku = p["sku"]
        hints = [CAT_KEYWORDS.get(cat, cat), CAT_KEYWORDS.get(cat, cat) + " product"]
        queries = [name, name + " product", name + " item",
                   " ".join([str(name), str(CAT_KEYWORDS.get(cat, cat))]),
                   CAT_KEYWORDS.get(cat, cat), " " + CAT_KEYWORDS.get(cat, cat) + " food"]
        best = None
        for q in queries:
            try:
                r = commons_search(q, limit=6)
                pages = list(r.get("query", {}).get("pages", {}).values())
                cands = pick_best(pages, name, cat)
                if cands:
                    # pick highest scoring candidate
                    sc, title, thumb, mime, w, h = cands[0]
                    if best is None or sc >= best[0]:
                        best = (sc, title, thumb, mime, w, h)
                if best and best[0] >= 55:
                    break
            except Exception as e:
                print(f"  [warn] {sku} search '{q}': {e}", file=sys.stderr)
        if best:
            sc, title, thumb, mime, w, h = best
            results.append({
                "sku": sku, "name": name, "category": cat,
                "image_url": thumb, "file": os.path.join(OUT_DIR, os.path.basename(thumb)),
                "score": sc, "mime": mime, "w": w, "h": h, "source": "wikimedia_commons"
            })
            print(f"[{i:02d}/{len(products)}] {sku} | {name[:48]:50s} | {cat:18s} | score={sc} | {title[:60]}")
        else:
            results.append({"sku": sku, "name": name, "category": cat, "image_url": None, "file": None, "score": 0, "mime": None, "w": 0, "h": 0, "source": "none"})
            print(f"[{i:02d}/{len(products)}] {sku} | {name[:48]:50s} | {cat:18s} | NO IMAGE FOUND")
    # download all found images
    ok = 0
    for res in results:
        if not res["image_url"]:
            continue
        path = res["file"]
        if os.path.exists(path) and os.path.getsize(path) > 5000:
            try:
                im = Image.open(path); im.verify()
                ok += 1
                continue
            except Exception:
                pass
        try:
            data = download(res["image_url"])
            if len(data) > 8000:
                open(path, "wb").write(data)
                im = Image.open(io.BytesIO(data))
                im.thumbnail((1024, 1024))
                im.save(path, quality=88)
                ok += 1
        except Exception as e:
            print(f"  [download warn] {res['sku']}: {e}", file=sys.stderr)
    print(f"\nDownloaded/verified {ok}/{len(results)} images.")
    with open("/Users/Moatazi/hotels-vendors-new/data/catalog-images/mapping.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Saved mapping.json")

if __name__ == "__main__":
    import io
    main()
