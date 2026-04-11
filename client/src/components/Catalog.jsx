import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCatalogProducts, resolveCatalogImageUrl } from "../services/portfolioService";

const PAGE_SIZE = 24;

const sortOptions = [
  { value: "title_asc", label: "Alphabetically, A-Z" },
  { value: "title_desc", label: "Alphabetically, Z-A" },
  { value: "newest", label: "Date, new to old" },
  { value: "oldest", label: "Date, old to new" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
];

const VISIBLE_CATEGORIES = new Set([
  "Artisanal Tile",
  "Swimming Pool Tile",
  "Porcelain Mosaic",
  "Ground Tile",
  "Moroccan Tile",
  "Wall Cladding",
  "Marble Mosaic",
  "Artificial Brick",
  "Wash Basin",
  "Other Mosaic",
]);

/* ---- Collapsible filter section ---- */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#27485c] pb-3">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full py-2 text-left">
        <span className="text-sm font-semibold uppercase tracking-wider text-[#E6C9A8]">{title}</span>
        <span className="text-[#D4A574] text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

/* ---- Fade-in on scroll observer ---- */
function useIntersectionObserver() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("catalog-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    const cards = el.querySelectorAll(".catalog-card");
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  });
  return ref;
}

function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ products: [], pagination: { page: 1, totalPages: 1, totalItems: 0 }, facets: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const gridRef = useIntersectionObserver();

  const filters = useMemo(
    () => ({
      page: Number(searchParams.get("page") || 1),
      page_size: PAGE_SIZE,
      search: searchParams.get("search") || "",
      product_category: searchParams.get("product_category") || "",
      collection: searchParams.get("collection") || "",
      material: searchParams.get("material") || "",
      selling_type: searchParams.get("selling_type") || "",
      availability: searchParams.get("availability") || "",
      min_price: searchParams.get("min_price") || "",
      max_price: searchParams.get("max_price") || "",
      sort: searchParams.get("sort") || "title_asc",
    }),
    [searchParams]
  );

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchCatalogProducts(filters);
        if (!ignore) {
          setData(response);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load catalog");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [filters]);

  const updateFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(name);
    } else {
      next.set(name, value);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const updatePage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams({ sort: "title_asc", page: "1" }));
  };

  const products = data.products || [];
  const pagination = data.pagination || { page: 1, totalPages: 1, totalItems: products.length };

  const FiltersPanel = (
    <div className="space-y-1">
      {/* Search */}
      <div className="pb-3 border-b border-[#27485c]">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="Search products…"
          className="w-full bg-[#143344] border border-[#27485c] rounded-lg px-3 py-2.5 text-[#F5E6D3] placeholder-[#6b8a9e] text-sm focus:border-[#C4864A] focus:outline-none transition-colors"
        />
      </div>

      {/* Collection / Product Category */}
      <FilterSection title="Product Category">
        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {(data.facets?.productCategories || [])
            .filter((item) => VISIBLE_CATEGORIES.has(item.value))
            .map((item) => (
            <button
              key={item.value}
              onClick={() => updateFilter("product_category", filters.product_category === item.value ? "" : item.value)}
              className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 rounded transition-colors ${
                filters.product_category === item.value
                  ? "text-[#C4864A] bg-[#143344]"
                  : "text-[#F5E6D3] hover:text-[#E6C9A8]"
              }`}
            >
              <span className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center text-xs ${
                filters.product_category === item.value ? "border-[#C4864A] bg-[#C4864A] text-white" : "border-[#5A2E0D]"
              }`}>
                {filters.product_category === item.value && "✓"}
              </span>
              {item.value} ({item.count})
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Material */}
      <FilterSection title="Material">
        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {(data.facets?.materials || []).map((item) => (
            <button
              key={item.value}
              onClick={() => updateFilter("material", filters.material === item.value ? "" : item.value)}
              className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 rounded transition-colors ${
                filters.material === item.value
                  ? "text-[#C4864A] bg-[#143344]"
                  : "text-[#F5E6D3] hover:text-[#E6C9A8]"
              }`}
            >
              <span className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center text-xs ${
                filters.material === item.value ? "border-[#C4864A] bg-[#C4864A] text-white" : "border-[#5A2E0D]"
              }`}>
                {filters.material === item.value && "✓"}
              </span>
              {item.value} ({item.count})
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Selling Type */}
      <FilterSection title="Selling Type" defaultOpen={false}>
        <div className="space-y-1">
          {(data.facets?.sellingTypes || []).map((item) => (
            <button
              key={item.value}
              onClick={() => updateFilter("selling_type", filters.selling_type === item.value ? "" : item.value)}
              className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 rounded transition-colors ${
                filters.selling_type === item.value
                  ? "text-[#C4864A] bg-[#143344]"
                  : "text-[#F5E6D3] hover:text-[#E6C9A8]"
              }`}
            >
              <span className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center text-xs ${
                filters.selling_type === item.value ? "border-[#C4864A] bg-[#C4864A] text-white" : "border-[#5A2E0D]"
              }`}>
                {filters.selling_type === item.value && "✓"}
              </span>
              {item.value} ({item.count})
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen={false}>
        <div className="space-y-1">
          {["available", "unavailable"].map((val) => (
            <button
              key={val}
              onClick={() => updateFilter("availability", filters.availability === val ? "" : val)}
              className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 rounded transition-colors capitalize ${
                filters.availability === val
                  ? "text-[#C4864A] bg-[#143344]"
                  : "text-[#F5E6D3] hover:text-[#E6C9A8]"
              }`}
            >
              <span className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center text-xs ${
                filters.availability === val ? "border-[#C4864A] bg-[#C4864A] text-white" : "border-[#5A2E0D]"
              }`}>
                {filters.availability === val && "✓"}
              </span>
              {val}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => updateFilter("min_price", e.target.value)}
            placeholder="Min"
            className="bg-[#143344] border border-[#27485c] rounded-lg px-3 py-2 text-[#F5E6D3] text-sm"
          />
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => updateFilter("max_price", e.target.value)}
            placeholder="Max"
            className="bg-[#143344] border border-[#27485c] rounded-lg px-3 py-2 text-[#F5E6D3] text-sm"
          />
        </div>
      </FilterSection>

      <button
        onClick={resetFilters}
        className="w-full mt-3 bg-[#8B4513] hover:bg-[#723A10] text-white rounded-lg py-2 text-sm font-semibold transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <section className="min-h-screen bg-[#0d2637] text-[#F5E6D3] pt-36 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Inline animation styles */}
      <style>{`
        .catalog-card {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .catalog-visible .catalog-card,
        .catalog-card.catalog-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #5A2E0D; border-radius: 4px; }
      `}</style>

      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">PRODUCT CATALOG</h1>
            <p className="text-[#E6C9A8] mt-1">Browse materials and finishes</p>
          </div>
          <button
            onClick={() => setMobileFiltersOpen((s) => !s)}
            className="lg:hidden bg-[#143344] border border-[#5A2E0D] px-4 py-2 rounded-lg text-sm"
          >
            {mobileFiltersOpen ? "Hide Filters" : "Filters"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8">
          {/* Filters sidebar */}
          <aside className={`${mobileFiltersOpen ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-28 bg-[#102a3b] border border-[#27485c] rounded-2xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              <h2 className="text-base font-bold mb-3 text-[#F5E6D3]">Filter:</h2>
              {FiltersPanel}
            </div>
          </aside>

          {/* Products grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#E6C9A8]">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="bg-transparent border-b border-[#5A2E0D] text-[#F5E6D3] py-1 text-sm focus:outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0d2637]">{option.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-[#E6C9A8]">{pagination.totalItems || 0} products</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx}>
                    <div className="aspect-square bg-[#143344] rounded-lg animate-pulse" />
                    <div className="h-4 bg-[#143344] rounded mt-3 w-3/4 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-[#143344] border border-[#5A2E0D] rounded-xl p-6 text-red-300">{error}</div>
            ) : products.length === 0 ? (
              <div className="bg-[#143344] border border-[#5A2E0D] rounded-xl p-6">No products match the selected filters.</div>
            ) : (
              <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                {products.map((product, idx) => {
                  const slug = product.handle || String(product.product_id);
                  const image = resolveCatalogImageUrl(product.gallery_images?.[0]?.url || "");
                  const fallbackImage = product.gallery_images?.[0]?.original_url || "";
                  return (
                    <Link
                      key={slug}
                      to={`/catalog/${slug}`}
                      className="catalog-card group"
                      style={{ transitionDelay: `${(idx % 8) * 60}ms` }}
                    >
                      <div className="aspect-square bg-[#f5f0eb] rounded-lg overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              if (!e.target.dataset.triedFallback && fallbackImage) {
                                e.target.dataset.triedFallback = "1";
                                e.target.src = fallbackImage;
                              } else {
                                e.target.style.display = "none";
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#999] text-sm">No image</div>
                        )}
                      </div>
                      <div className="mt-3 px-0.5">
                        <h2 className="text-sm text-[#F5E6D3] leading-snug line-clamp-2 group-hover:text-[#C4864A] transition-colors">
                          {product.title}
                        </h2>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => updatePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 rounded-lg text-sm text-[#E6C9A8] hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 7) {
                    page = i + 1;
                  } else if (pagination.page <= 4) {
                    page = i < 5 ? i + 1 : i === 5 ? "…" : pagination.totalPages;
                  } else if (pagination.page >= pagination.totalPages - 3) {
                    page = i === 0 ? 1 : i === 1 ? "…" : pagination.totalPages - (6 - i);
                  } else {
                    page = i === 0 ? 1 : i === 1 ? "…" : i === 5 ? "…" : pagination.page + (i - 3);
                  }
                  if (page === "…") return <span key={`dots-${i}`} className="px-2 py-1 text-[#6b8a9e]">…</span>;
                  return (
                    <button
                      key={page}
                      onClick={() => updatePage(page)}
                      className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                        page === pagination.page
                          ? "bg-[#C4864A] text-white"
                          : "text-[#E6C9A8] hover:bg-[#143344]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => updatePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 rounded-lg text-sm text-[#E6C9A8] hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Catalog;
