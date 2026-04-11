import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchCatalogProductDetail, resolveCatalogImageUrl } from "../services/portfolioService";

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2.5">
      <span className="font-semibold text-[#F5E6D3]">{label}:</span>{" "}
      <span className="text-[#d9cfc4]">{value}</span>
    </div>
  );
}

function CatalogProductDetails() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchCatalogProductDetail(productId);
        if (!ignore) {
          setPayload(response);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load product details");
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
  }, [productId]);

  const backQuery = searchParams.toString();

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0d2637] pt-36 px-4 text-[#F5E6D3]">
        <div className="max-w-7xl mx-auto">
          <div className="h-6 w-32 bg-[#143344] rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[3/4] bg-[#143344] rounded-lg animate-pulse" />
                <div className="aspect-[3/4] bg-[#143344] rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-[#143344] rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-[#143344] rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-[#143344] rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !payload?.product) {
    return (
      <section className="min-h-screen bg-[#0d2637] pt-36 px-4">
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-red-300 text-lg">{error || "Product not found"}</p>
          <Link to="/catalog" className="text-[#C4864A] hover:underline mt-4 inline-block">← Back to Catalog</Link>
        </div>
      </section>
    );
  }

  const product = payload.product;

  // Gallery images ONLY from gallery_images (not body_images/usage_image)
  const galleryImages = (product.gallery_images || []).map((g) => ({
    src: resolveCatalogImageUrl(g.url),
    original: g.original_url || "",
  }));

  // Usage image is separate — the icon image showing WALL/FLOOR/KITCHEN etc.
  const usageImage = resolveCatalogImageUrl(product.usage_image_url || "");
  const usageImageOriginal = product.usage_image_original || "";

  // Fallback usage image from a related product (when usage image fails to load)
  const fallbackUsageImage = (() => {
    if (!payload.relatedProducts) return "";
    for (const rel of payload.relatedProducts) {
      const url = rel.usage_image_url || rel.usage_image_original || "";
      if (url) return resolveCatalogImageUrl(url);
    }
    return "";
  })();

  return (
    <section className="min-h-screen bg-[#0d2637] text-[#F5E6D3] pt-36 pb-16 px-4 sm:px-6 lg:px-8">
      <style>{`
        .detail-fade-in { animation: detailFadeUp 0.6s ease both; }
        @keyframes detailFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .gallery-img { cursor: zoom-in; transition: transform 0.4s ease; }
        .gallery-img:hover { transform: scale(1.02); }
      `}</style>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      <div className="max-w-7xl mx-auto detail-fade-in">
        <Link
          to={backQuery ? `/catalog?${backQuery}` : "/catalog"}
          className="inline-flex items-center gap-2 text-[#E6C9A8] hover:text-[#C4864A] mb-6 text-sm transition-colors"
        >
          <span>←</span>
          <span>Back to Catalog</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Gallery grid (mosycle-style 2-column gallery) */}
          <div>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-[#f5f0eb] rounded-lg overflow-hidden"
                    onClick={() => setLightboxImg(img.src)}
                  >
                    <img
                      src={img.src}
                      alt={`${product.title} - ${idx + 1}`}
                      className="w-full h-full object-cover gallery-img aspect-[3/4]"
                      loading={idx < 4 ? "eager" : "lazy"}
                      onError={(e) => {
                        if (!e.target.dataset.triedFallback && img.original) {
                          e.target.dataset.triedFallback = "1";
                          e.target.src = img.original;
                        } else {
                          e.target.style.display = "none";
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-[#143344] rounded-lg flex items-center justify-center text-[#6b8a9e]">
                No gallery images
              </div>
            )}
          </div>

          {/* Right: Product info */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-6">{product.title}</h1>

            {/* Specs */}
            <div className="divide-y divide-[#27485c] mb-6">
              <SpecRow label="Product number" value={product.product_number} />
              <SpecRow label="Size/piece" value={product.size_per_piece} />
              <SpecRow label="Material" value={product.material} />
              <SpecRow label="Packing" value={product.packing} />
              <SpecRow label="Weight" value={product.weight} />
              <SpecRow label="Sheet Size" value={product.sheet_size} />
              <SpecRow label="Per Box Selling" value={product.selling_type} />
              {product.price && product.price !== "0.00" && (
                <SpecRow label="Price" value={`${product.price} ${product.price_currency || ""}`} />
              )}
            </div>

            {/* Usage image (icons: INDOOR, OUTDOOR, WALL, FLOOR, etc.) */}
            {usageImage && (
              <div className="mb-6">
                <h3 className="font-semibold text-[#F5E6D3] mb-2 text-lg">Usage</h3>
                <div className="bg-[#0d2637] rounded-lg inline-flex overflow-hidden">
                  <div className="overflow-hidden" style={{ marginLeft: "-55px" }}>
                    <img
                      src={usageImage}
                      alt="Usage icons"
                      className="h-20 w-auto block"
                      onError={(e) => {
                      const step = parseInt(e.target.dataset.fallbackStep || "0", 10);
                      if (step === 0 && usageImageOriginal) {
                        e.target.dataset.fallbackStep = "1";
                        e.target.src = usageImageOriginal;
                      } else if (step <= 1 && fallbackUsageImage) {
                        e.target.dataset.fallbackStep = "2";
                        e.target.src = fallbackUsageImage;
                      } else {
                        e.target.style.display = "none";
                      }
                    }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Collections */}
            {(product.collections || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.collections.map((col) => (
                  <Link
                    key={col}
                    to={`/catalog?collection=${encodeURIComponent(col)}`}
                    className="text-xs bg-[#143344] border border-[#27485c] px-3 py-1.5 rounded-full text-[#E6C9A8] hover:border-[#C4864A] transition-colors"
                  >
                    {col}
                  </Link>
                ))}
              </div>
            )}

            {/* Order via WhatsApp */}
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "201277294573"}?text=${encodeURIComponent(
                `Hi, I'm interested in this product:\n${product.title}\n${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Order via WhatsApp
            </a>
          </div>
        </div>

        {/* Description paragraphs */}
        {(product.description_paragraphs || []).length > 0 && (
          <div className="mt-12 max-w-4xl">
            {product.description_paragraphs.map((block, idx) => (
              <div key={idx} className="mb-6">
                {block.heading && (
                  <h3 className="font-semibold text-[#E6C9A8] mb-2 text-lg">·{block.heading}</h3>
                )}
                <p className="text-[#d9cfc4] leading-7 text-sm">{block.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Related products */}
        {(payload.relatedProducts || []).length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {payload.relatedProducts.map((item) => {
                const slug = item.handle || String(item.product_id);
                const image = resolveCatalogImageUrl(item.gallery_images?.[0]?.url || "");
                const fallback = item.gallery_images?.[0]?.original_url || "";
                return (
                  <Link key={slug} to={`/catalog/${slug}`} className="group">
                    <div className="aspect-square bg-[#f5f0eb] rounded-lg overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            if (!e.target.dataset.triedFallback && fallback) {
                              e.target.dataset.triedFallback = "1";
                              e.target.src = fallback;
                            } else {
                              e.target.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#999] text-sm">No image</div>
                      )}
                    </div>
                    <p className="mt-2 text-sm line-clamp-2 group-hover:text-[#C4864A] transition-colors">{item.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CatalogProductDetails;
