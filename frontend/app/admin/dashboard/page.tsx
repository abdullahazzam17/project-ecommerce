"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, adminAuthHeaders, apiFetch } from "../../../lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  image_url?: string;
  is_coming_soon?: boolean;
}

interface Order {
  id: number;
  order_id: string;
  product_id: number;
  quantity: number;
  size?: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  created_at: string;
}

// Helper cerdas untuk memisahkan gambar Base64 tanpa merusak koma bawaan Data URI
const parseImages = (urlStr?: string): string[] => {
  if (!urlStr) return [];
  if (urlStr.includes("|||")) {
    return urlStr.split("|||").map((s) => s.trim()).filter(Boolean);
  }
  // Jika data di database tersimpan dengan koma, ekstrak Data URI utuh menggunakan regex
  const regex = /(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s,]+)/g;
  const matches = urlStr.match(regex);
  if (matches && matches.length > 0) {
    return matches;
  }
  return urlStr.split(",").map((s) => s.trim()).filter(Boolean);
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "products">("dashboard");
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");

  const authHeaders = (): HeadersInit => adminAuthHeaders();

  // Data & Filter State
  const [analytics, setAnalytics] = useState({ total_orders: 0, paid_orders: 0, pending_orders: 0, total_revenue: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeFilter, setTimeFilter] = useState("7_days");

  // Modal Product State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    price: 0, 
    stock: 0, 
    description: "", 
    category: "Kaos", 
    image_url: "",
    is_coming_soon: false 
  });

  // Multi-Image Queue State
  const [imageList, setImageList] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Crop & Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/admin/analytics`, { headers: authHeaders() });
      if (res.ok) setAnalytics(await res.json());
      else if (res.status === 401) router.push("/admin/login");
    } catch (err) { console.error(err); }
  }, [router]);

  const fetchOrders = useCallback(async (filter: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/admin/orders?range=${filter}`, { headers: authHeaders() });
      if (res.ok) setOrders(await res.json());
      else if (res.status === 401) router.push("/admin/login");
    } catch (err) { console.error(err); }
  }, [router]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/products`);
      if (res.ok) setProducts(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  // Muat data awal setelah verifikasi token admin (fungsi sudah dideklarasikan di atas).
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Pemuatan data awal: setState terjadi setelah `await fetch`, bukan render sinkron.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data setelah verifikasi token admin
    fetchAnalytics();
    fetchOrders(timeFilter);
    fetchProducts();
  }, [router, timeFilter, fetchAnalytics, fetchOrders, fetchProducts]);

  // Render Canvas untuk Preview
  useEffect(() => {
    if (imageList.length > 0 && imageList[activeImageIdx] && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      if (imageList[activeImageIdx].startsWith("http")) {
        img.crossOrigin = "anonymous";
      }

      img.src = imageList[activeImageIdx];
      img.onload = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width * zoomLevel;
        const height = (img.height / img.width) * width;

        const x = (canvas.width - width) / 2 + offset.x;
        const y = (canvas.height - height) / 2 + offset.y;

        ctx.drawImage(img, x, y, width, height);
      };
    }
  }, [zoomLevel, offset, activeImageIdx, imageList]);

  // Handler Upload File
  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} terlalu besar (maks 2MB)!`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          setImageList((prev) => [...prev, resultStr]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const removeQueueImage = (indexToRemove: number) => {
    const filtered = imageList.filter((_, idx) => idx !== indexToRemove);
    setImageList(filtered);
    if (activeImageIdx >= filtered.length) {
      setActiveImageIdx(Math.max(0, filtered.length - 1));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedImages = [...imageList];
    if (canvasRef.current && imageList.length > 0) {
      try {
        const cropped = canvasRef.current.toDataURL("image/jpeg", 0.8);
        if (cropped && cropped.length > 100) {
          updatedImages[activeImageIdx] = cropped;
        }
      } catch (err) {
        console.error("Canvas export error:", err);
      }
    }

    // Gabungkan dengan ||| agar tidak memotong koma base64
    const payload = {
      ...formData,
      image_url: updatedImages.filter(Boolean).join("|||")
    };

    const url = editingProduct
      ? `${API_URL}/api/products/${editingProduct.id}`
      : `${API_URL}/api/products`;
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await apiFetch(url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan produk");

      setShowProductModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert("Gagal menyimpan produk. Periksa kembali ukuran data.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      try {
        await apiFetch(`${API_URL}/api/products/${id}`, { method: "DELETE", headers: authHeaders() });
        fetchProducts();
      } catch { alert("Gagal menghapus produk"); }
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      price: p.price,
      stock: p.stock,
      description: p.description,
      category: p.category,
      image_url: p.image_url || "",
      is_coming_soon: p.is_coming_soon || false
    });

    const imgs = parseImages(p.image_url);
    setImageList(imgs);
    setActiveImageIdx(0);
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
    setShowProductModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", price: 0, stock: 0, description: "", category: "Kaos", image_url: "", is_coming_soon: false });
    setImageList([]);
    setActiveImageIdx(0);
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const getFilterLabel = () => {
    switch (timeFilter) {
      case "today": return "today";
      case "yesterday": return "yesterday";
      case "7_days": return "the last 7 days";
      case "1_month": return "the last 30 days";
      case "3_months": return "the last 3 months";
      case "1_year": return "the last 1 year";
      default: return "the selected period";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-slate-800 tracking-tight">Zoom Custom Admin</span>
          <nav className="flex gap-4 text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "dashboard" ? "text-[#0071e3] bg-blue-50 font-bold" : "hover:text-slate-800"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "orders" ? "text-[#0071e3] bg-blue-50 font-bold" : "hover:text-slate-800"}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "products" ? "text-[#0071e3] bg-blue-50 font-bold" : "hover:text-slate-800"}`}
            >
              Products
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-slate-700">admin</span>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            A
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-8 py-8 flex-1 space-y-6">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 font-medium">
              Track your business performance in {getFilterLabel()}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#deebff] p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <span className="text-slate-600 text-xs font-semibold">Total Transaction Amount</span>
                <div className="text-3xl font-bold text-slate-900 mt-4">Rp{analytics.total_revenue.toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-[#deebff] p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <span className="text-slate-600 text-xs font-semibold">Number of Transaction</span>
                <div className="text-3xl font-bold text-slate-900 mt-4">{analytics.total_orders}</div>
              </div>
            </div>

            <div className="flex justify-end">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7_days">Last 7 days</option>
                <option value="1_month">Last 30 days</option>
                <option value="3_months">Last 3 months</option>
                <option value="1_year">Last 1 year</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Total Transaction Amount</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Rp{analytics.total_revenue.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                      onClick={() => setViewMode("graph")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${viewMode === "graph" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      📊 Graph
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                      📑 Table
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center my-auto py-8 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-3">📈</div>
                    <h4 className="text-sm font-bold text-slate-800">{"There's no transaction"}</h4>
                  </div>
                ) : (
                  <div className="space-y-3 my-auto">
                    {orders.slice(0, 4).map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                        <span className="font-mono font-semibold">{o.order_id}</span>
                        <span className="text-slate-500">{o.customer_name}</span>
                        <span className="font-bold">Rp{o.total_amount.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                <h3 className="text-sm font-bold text-slate-800">Transaction by Payment Method</h3>
                <div className="flex flex-col items-center justify-center my-auto py-8 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-3">🍕</div>
                  <h4 className="text-sm font-bold text-slate-800">Midtrans Snap Integrated</h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-800">Data Orderan Pembeli</h1>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs min-w-max">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 px-2">TANGGAL</th>
                    <th className="pb-3 px-2">ORDER ID</th>
                    <th className="pb-3 px-2">PEMBELI</th>
                    <th className="pb-3 px-2">SIZE</th>
                    <th className="pb-3 px-2">TOTAL</th>
                    <th className="pb-3 px-2">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="h-12 hover:bg-slate-50">
                      <td className="text-slate-400 px-2">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                      <td className="font-mono font-bold px-2">{o.order_id}</td>
                      <td className="px-2">{o.customer_name}</td>
                      <td className="px-2 font-black text-blue-600">{o.size || "L"}</td>
                      <td className="font-bold px-2">Rp{o.total_amount.toLocaleString("id-ID")}</td>
                      <td className="px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${o.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-800">Katalog Produk Store</h1>
              <button
                onClick={() => { setEditingProduct(null); resetForm(); setShowProductModal(true); }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700"
              >
                + Tambah Produk Baru
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3">FOTO UTAMA</th>
                    <th className="pb-3">NAMA PRODUK</th>
                    <th className="pb-3">KATEGORI</th>
                    <th className="pb-3">STATUS</th>
                    <th className="pb-3">HARGA</th>
                    <th className="pb-3">STOK</th>
                    <th className="pb-3">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => {
                    const imgs = parseImages(p.image_url);
                    const firstImg = imgs[0] || "";
                    return (
                      <tr key={p.id} className="h-14">
                        <td>
                          {firstImg ? (
                            <img src={firstImg} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100 border" />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-semibold">No Image</span>
                          )}
                        </td>
                        <td className="font-bold text-slate-800">{p.name}</td>
                        <td>{p.category}</td>
                        <td>
                          {p.is_coming_soon ? (
                            <span className="bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px]">COMING SOON</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]">AVAILABLE</span>
                          )}
                        </td>
                        <td>Rp{p.price.toLocaleString("id-ID")}</td>
                        <td>{p.stock} pcs</td>
                        <td className="space-x-3">
                          <button onClick={() => openEditModal(p)} className="text-blue-600 font-bold hover:underline">Edit</button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 font-bold hover:underline">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProductModal(false)} className="absolute top-5 right-5 text-slate-400 text-sm font-bold">✕</button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Produk</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl mt-1 border border-slate-200"
                  required
                />
              </div>

              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-900 block">{'Set Sebagai "Coming Soon"?'}</span>
                  <span className="text-[10px] text-purple-600">Produk akan masuk ke halaman khusus Coming Soon.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_coming_soon}
                  onChange={(e) => setFormData({ ...formData, is_coming_soon: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Kategori Produk</label>
                <select
                  value={["Kaos", "Hoodie", "Sweater", "Celana"].includes(formData.category) ? formData.category : "Other"}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === "Other") setFormData({ ...formData, category: "" });
                    else setFormData({ ...formData, category: selected });
                  }}
                  className="w-full bg-slate-50 p-2.5 rounded-xl mt-1 border border-slate-200"
                >
                  <option value="Kaos">Kaos</option>
                  <option value="Hoodie">Hoodie</option>
                  <option value="Sweater">Sweater</option>
                  <option value="Celana">Celana</option>
                  <option value="Other">Other (Ketik Sendiri...)</option>
                </select>

                {!["Kaos", "Hoodie", "Sweater", "Celana"].includes(formData.category) && (
                  <input
                    type="text"
                    placeholder="Masukkan nama kategori kustom..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-200"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Harga (Rp)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl mt-1 border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Stok</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl mt-1 border border-slate-200"
                    required
                  />
                </div>
              </div>

              {/* MULTI-FOTO ANTREAN & ZOOM OUT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-700 block">Antrean Foto Produk (Multi-Upload)</label>
                    <span className="text-[10px] text-slate-400">Foto pertama (paling kiri) otomatis jadi display utama di katalog.</span>
                  </div>
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
                    + Upload Foto
                    <input type="file" accept="image/*" multiple onChange={handleFilesUpload} className="hidden" />
                  </label>
                </div>

                {imageList.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2 border-y border-slate-100">
                    {imageList.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setActiveImageIdx(idx); setZoomLevel(1); setOffset({ x: 0, y: 0 }); }}
                        className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          idx === activeImageIdx ? "border-blue-600 scale-105 shadow-md" : "border-slate-200 opacity-70"
                        }`}
                      >
                        <img src={img} alt="queue" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[8px] font-bold text-center">
                            UTAMA
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeQueueImage(idx); }}
                          className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 rounded-bl text-[10px] flex items-center justify-center font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageList.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-2xl space-y-2 text-center border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium">
                      💡 Klik foto di antrean atas untuk mengeditnya. Geser mouse & atur zoom (bisa zoom out sampai 0.3x):
                    </p>
                    <div className="relative w-full h-48 bg-white rounded-xl overflow-hidden border border-slate-200 cursor-move shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={260}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-500">Zoom Out/In ({zoomLevel.toFixed(2)}x):</span>
                      <input
                        type="range"
                        min="0.3"
                        max="3"
                        step="0.05"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl mt-1 border border-slate-200 h-20"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-4 shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}