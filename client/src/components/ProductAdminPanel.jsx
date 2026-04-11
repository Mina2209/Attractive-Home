import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./Toast";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  fetchCatalogProducts,
  getProductUploadUrls,
  updateCatalogProduct,
  uploadFile,
} from "../services/portfolioService";

function ProductAdminPanel() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, product: null });
  const [mediaFiles, setMediaFiles] = useState([]);

  const [form, setForm] = useState({
    product_id: "",
    title: "",
    handle: "",
    vendor: "",
    material: "",
    selling_type: "",
    price: "",
    price_currency: "AED",
    available: true,
    usage_image_url: "",
    collections_text: "",
  });

  const getAdminPassword = () => import.meta.env.VITE_DASHBOARD_PASSWORD || "admin123";

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchCatalogProducts({ page: 1, page_size: 500, sort: "newest" });
      setProducts(response.products || []);
    } catch (error) {
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      String(p.title || "").toLowerCase().includes(q) ||
      String(p.handle || "").toLowerCase().includes(q) ||
      String(p.product_number || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const resetForm = () => {
    setForm({
      product_id: "",
      title: "",
      handle: "",
      vendor: "",
      material: "",
      selling_type: "",
      price: "",
      price_currency: "AED",
      available: true,
      usage_image_url: "",
      collections_text: "",
    });
    setMediaFiles([]);
    setUploadProgress(0);
    setUploadStatus("");
    setEditingProduct(null);
    setShowForm(false);
  };

  const fillFormForEdit = (product) => {
    setEditingProduct(product);
    setForm({
      product_id: String(product.product_id || ""),
      title: product.title || "",
      handle: product.handle || "",
      vendor: product.vendor || "",
      material: product.material || "",
      selling_type: product.selling_type || "",
      price: product.price || "",
      price_currency: product.price_currency || "AED",
      available: product.available !== false,
      usage_image_url: product.usage_image_url || product.primary_image || "",
      collections_text: (product.collections || []).join(" | "),
    });
    setMediaFiles([]);
    setShowForm(true);
  };

  const handleMediaFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const removeMediaFile = (indexToRemove) => {
    setMediaFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadSelectedFiles = async (productIdentifier, adminPassword) => {
    if (mediaFiles.length === 0) {
      return;
    }

    const files = mediaFiles.map((file, index) => ({
      filename: `${index === 0 ? "cover" : `media_${index}`}.${file.name.split(".").pop()}`,
      type: index === 0 ? "cover" : "media",
      contentType: file.type,
      file,
    }));

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("Requesting upload URLs...");

    try {
      const response = await getProductUploadUrls(
        productIdentifier,
        files.map(({ filename, type, contentType }) => ({ filename, type, contentType })),
        adminPassword
      );

      const uploadUrls = response.uploadUrls || [];
      for (let index = 0; index < files.length; index += 1) {
        const currentFile = files[index];
        const uploadUrl = uploadUrls[index]?.uploadUrl;
        if (!uploadUrl) {
          throw new Error(`Missing upload URL for ${currentFile.filename}`);
        }

        setUploadStatus(`Uploading ${currentFile.file.name}...`);
        const baseProgress = Math.round((index / files.length) * 100);
        const segmentWeight = 100 / files.length;

        await uploadFile(uploadUrl, currentFile.file, (percent) => {
          setUploadProgress(baseProgress + Math.round((percent / 100) * segmentWeight));
        });
      }

      setUploadStatus("Upload complete. Processing media in background...");
      setUploadProgress(100);
      toast.success("Files uploaded. Processed media will appear after Lambda conversion completes.");
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.warning("Product title is required");
      return;
    }

    const payload = {
      product_id: form.product_id ? Number(form.product_id) : undefined,
      title: form.title,
      handle: form.handle,
      vendor: form.vendor,
      material: form.material,
      selling_type: form.selling_type,
      price: form.price,
      price_currency: form.price_currency,
      available: form.available,
      usage_image_url: form.usage_image_url,
      primary_image: form.usage_image_url,
      collections: form.collections_text
        .split("|")
        .map((v) => v.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);
      const adminPassword = getAdminPassword();
      let savedProductIdentifier = editingProduct?.handle || String(editingProduct?.product_id || "");

      if (editingProduct) {
        const response = await updateCatalogProduct(editingProduct.handle || String(editingProduct.product_id), payload, adminPassword);
        savedProductIdentifier = response.product?.handle || String(response.product?.product_id || savedProductIdentifier);
        toast.success("Product updated successfully");
      } else {
        const response = await createCatalogProduct(payload, adminPassword);
        savedProductIdentifier = response.product?.handle || String(response.product?.product_id || "");
        toast.success("Product created successfully");
      }

      if (savedProductIdentifier && mediaFiles.length > 0) {
        await uploadSelectedFiles(savedProductIdentifier, adminPassword);
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      toast.error(`Failed to save product: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const product = confirmModal.product;
    setConfirmModal({ isOpen: false, product: null });
    if (!product) return;

    try {
      await deleteCatalogProduct(product.handle || String(product.product_id), getAdminPassword());
      toast.success("Product deleted successfully");
      await loadProducts();
    } catch (error) {
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2637] pt-36 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F5E6D3] tracking-wide">PRODUCTS DASHBOARD</h1>
            <p className="text-[#E6C9A8] mt-1">Create, edit and remove catalog products</p>
            <Link to="/dashboard" className="inline-flex mt-3 text-sm text-[#D4A574] hover:text-[#F5E6D3]">Go to Projects Dashboard</Link>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-6 py-3 rounded-lg font-semibold bg-[#8B4513] text-white hover:bg-[#723A10]"
          >
            {showForm ? "View Products" : "Add Product"}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={submitForm} className="bg-[#143344] rounded-2xl border border-[#5A2E0D] p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-[#F5E6D3]">{editingProduct ? "Edit Product" : "Create Product"}</h2>

            {(saving || uploading) && (
              <div className="bg-[#0d2637] border border-[#5A2E0D] rounded-xl p-4">
                <div className="flex justify-between text-sm text-[#F5E6D3] mb-2">
                  <span>{uploadStatus || (saving ? "Saving product..." : "Uploading...")}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#091a26] rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#C4864A] to-[#8B4513] h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product ID (optional)"
                value={form.product_id}
                onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Product handle (optional)"
                value={form.handle}
                onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Product title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="md:col-span-2 bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
                required
              />
              <input
                type="text"
                placeholder="Vendor"
                value={form.vendor}
                onChange={(e) => setForm((prev) => ({ ...prev, vendor: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Material"
                value={form.material}
                onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Selling type"
                value={form.selling_type}
                onChange={(e) => setForm((prev) => ({ ...prev, selling_type: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={form.usage_image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, usage_image_url: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <div className="md:col-span-2">
                <label className="block text-sm text-[#E6C9A8] mb-2">Upload media files</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaFilesChange}
                  className="block w-full text-sm text-[#F5E6D3] file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#8B4513] file:text-white hover:file:bg-[#723A10] bg-[#0d2637] rounded-lg border border-[#5A2E0D]"
                />
                <p className="text-xs text-[#D4A574] mt-2">First uploaded file is treated as the cover media. Images are converted to WebP and videos to HLS by Lambda.</p>
              </div>
              <input
                type="text"
                placeholder="Collections (use | between values)"
                value={form.collections_text}
                onChange={(e) => setForm((prev) => ({ ...prev, collections_text: e.target.value }))}
                className="md:col-span-2 bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
              <input
                type="text"
                placeholder="Currency"
                value={form.price_currency}
                onChange={(e) => setForm((prev) => ({ ...prev, price_currency: e.target.value }))}
                className="bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D] rounded-lg px-4 py-3"
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className="bg-[#0d2637] border border-[#5A2E0D] rounded-xl p-4">
                <h3 className="text-[#F5E6D3] font-medium mb-3">Selected uploads ({mediaFiles.length})</h3>
                <div className="space-y-2">
                  {mediaFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 rounded-lg border border-[#27485c] px-3 py-2">
                      <div>
                        <p className="text-sm text-[#F5E6D3]">{file.name}</p>
                        <p className="text-xs text-[#D4A574]">{index === 0 ? "Cover media" : "Gallery media"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(index)}
                        className="text-red-300 hover:text-red-200 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-[#F5E6D3]">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))}
              />
              Available
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-3 rounded-lg bg-[#8B4513] hover:bg-[#723A10] text-white font-semibold disabled:opacity-60"
              >
                {saving || uploading ? "Processing..." : editingProduct ? "Update Product" : "Create Product"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-lg bg-[#0d2637] text-[#F5E6D3] border border-[#5A2E0D]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-[#143344] text-[#F5E6D3] border border-[#5A2E0D] rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="h-64 rounded-xl bg-[#143344] animate-pulse" />)
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full bg-[#143344] rounded-xl border border-[#5A2E0D] p-6 text-[#E6C9A8]">No products found.</div>
              ) : (
                filteredProducts.map((product) => {
                  const key = product.handle || String(product.product_id);
                  const image = product.primary_image || product.usage_image_url || product.gallery_images?.[0]?.url || "";
                  return (
                    <div key={key} className="bg-[#143344] rounded-xl border border-[#5A2E0D] overflow-hidden">
                      <div className="aspect-[4/3] bg-[#091a26]">
                        {image ? <img src={image} alt={product.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-[#E6C9A8]">{product.material || ""}</p>
                        <h3 className="font-semibold text-[#F5E6D3] line-clamp-2 min-h-[3.2rem]">{product.title}</h3>
                        <p className="text-sm text-[#D4A574] mt-1">{product.selling_type || ""}</p>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => fillFormForEdit(product)}
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-600/30 text-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, product })}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600/30 text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete \"${confirmModal.product?.title || "this product"}\"? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default ProductAdminPanel;
