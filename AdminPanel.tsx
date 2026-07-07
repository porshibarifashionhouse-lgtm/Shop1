/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  Package, 
  ClipboardList, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Trash, 
  Save, 
  CheckCircle, 
  DollarSign, 
  Star, 
  Clock, 
  Truck, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { AppData, Product, PromoCode, StoreSettings, Order, Review } from "../types";

interface AdminPanelProps {
  data: AppData;
  onRefresh: () => void;
  onToggleAdmin: () => void;
}

export default function AdminPanel({ data, onRefresh, onToggleAdmin }: AdminPanelProps) {
  const { product, reviews, orders, promoCodes, settings } = data;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'product' | 'orders' | 'reviews' | 'settings'>('dashboard');

  // Product Edit State
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });
  const [newFeature, setNewFeature] = useState("");
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [newColorInput, setNewColorInput] = useState("");
  const [newSizeInput, setNewSizeInput] = useState("");

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // AI Review Reply States
  const [isGeneratingReply, setIsGeneratingReply] = useState<{ [reviewId: string]: boolean }>({});
  const [reviewReplyInputs, setReviewReplyInputs] = useState<{ [reviewId: string]: string }>({});

  // Promo Codes State
  const [editedPromos, setEditedPromos] = useState<PromoCode[]>([...promoCodes]);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoType, setNewPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [newPromoValue, setNewPromoValue] = useState(10);

  // Settings State
  const [editedSettings, setEditedSettings] = useState<StoreSettings>({ ...settings });

  // Saved alerts
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-set premium smartwatch image URLs for quick selection
  const presetWatchImages = [
    { url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800", name: "Premium Onyx Black" },
    { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800", name: "Ice White Chrome" },
    { url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800", name: "Cognac Leather Classic" },
    { url: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=800", name: "Active Slate Grey" },
    { url: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&q=80&w=800", name: "Nebula Rose Gold" }
  ];

  // Calculations for dashboard
  const formatPrice = (amount: number) => {
    return settings.currency === 'BDT' 
      ? `৳${amount.toLocaleString('en-IN')}`
      : `$${amount.toFixed(2)}`;
  };

  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  // Handle entire updates
  const handleSaveStoreData = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: editedProduct,
          promoCodes: editedPromos,
          settings: editedSettings
        })
      });

      const result = await response.json();
      if (result.success) {
        setSaveSuccess(true);
        onRefresh();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert("Error saving: " + result.error);
      }
    } catch (error) {
      console.error("Save store data error:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Order status update
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
      }
    } catch (error) {
      console.error("Order update error:", error);
    }
  };

  // Review reply save
  const handleReviewReplySave = async (reviewId: string) => {
    const replyText = reviewReplyInputs[reviewId];
    if (!replyText) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText })
      });
      const result = await response.json();
      if (result.success) {
        // Clear input and reload
        setReviewReplyInputs(prev => ({ ...prev, [reviewId]: "" }));
        onRefresh();
      }
    } catch (error) {
      console.error("Review reply error:", error);
    }
  };

  // Delete a review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
      }
    } catch (error) {
      console.error("Delete review error:", error);
    }
  };

  // Call Gemini to generate Description
  const handleAiCopywriterSubmit = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingCopy(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentTitle: editedProduct.title,
          originalDescription: editedProduct.description
        })
      });

      const result = await response.json();
      if (result.success && result.text) {
        setEditedProduct(prev => ({ ...prev, description: result.text }));
        setAiPrompt("");
      } else {
        alert("Gemini error: " + (result.error || "Failed to generate copy. Ensure GEMINI_API_KEY is configured in Secrets panel."));
      }
    } catch (error) {
      console.error("AI Copy generation error:", error);
      alert("Something went wrong connecting to AI service.");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Call Gemini to generate Review Reply
  const handleAiReviewReply = async (review: Review) => {
    setIsGeneratingReply(prev => ({ ...prev, [review.id]: true }));
    try {
      const response = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: review.comment,
          customerName: review.userName,
          storeName: editedSettings.storeName
        })
      });

      const result = await response.json();
      if (result.success && result.text) {
        setReviewReplyInputs(prev => ({ ...prev, [review.id]: result.text }));
      } else {
        alert("Failed to auto-reply. Ensure GEMINI_API_KEY is set in your Secrets configuration.");
      }
    } catch (error) {
      console.error("AI reply error:", error);
    } finally {
      setIsGeneratingReply(prev => ({ ...prev, [review.id]: false }));
    }
  };

  // Add Product Image
  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setEditedProduct(prev => ({
      ...prev,
      images: [...prev.images, customImageUrl.trim()]
    }));
    setCustomImageUrl("");
  };

  // Select Preset Image
  const handleAddPresetImage = (url: string) => {
    if (editedProduct.images.includes(url)) return;
    setEditedProduct(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
  };

  // Remove Product Image
  const handleRemoveImage = (indexToRemove: number) => {
    setEditedProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Add Promo Code
  const handleAddPromoCode = () => {
    if (!newPromoCode.trim()) return;
    const code = newPromoCode.trim().toUpperCase();
    if (editedPromos.some(p => p.code === code)) {
      alert("Promo code already exists!");
      return;
    }

    const newPromo: PromoCode = {
      code,
      discountType: newPromoType,
      discountValue: newPromoValue,
      isActive: true
    };

    setEditedPromos([...editedPromos, newPromo]);
    setNewPromoCode("");
  };

  // Toggle Promo Code Active
  const handleTogglePromo = (code: string) => {
    setEditedPromos(editedPromos.map(p => 
      p.code === code ? { ...p, isActive: !p.isActive } : p
    ));
  };

  // Delete Promo Code
  const handleDeletePromo = (code: string) => {
    setEditedPromos(editedPromos.filter(p => p.code !== code));
  };

  // Add feature list item
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setEditedProduct(prev => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature("");
  };

  // Remove feature list item
  const handleRemoveFeature = (idxToRemove: number) => {
    setEditedProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Add Spec Row
  const handleAddSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    setEditedProduct(prev => ({
      ...prev,
      specs: [...prev.specs, { label: newSpecLabel.trim(), value: newSpecValue.trim() }]
    }));
    setNewSpecLabel("");
    setNewSpecValue("");
  };

  // Remove Spec Row
  const handleRemoveSpec = (idxToRemove: number) => {
    setEditedProduct(prev => ({
      ...prev,
      specs: prev.specs.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Add Color Variant
  const handleAddColor = () => {
    if (!newColorInput.trim()) return;
    const currentColors = editedProduct.colors || [];
    if (currentColors.includes(newColorInput.trim())) return;
    setEditedProduct(prev => ({
      ...prev,
      colors: [...currentColors, newColorInput.trim()]
    }));
    setNewColorInput("");
  };

  // Remove Color Variant
  const handleRemoveColor = (colorToRemove: string) => {
    const currentColors = editedProduct.colors || [];
    setEditedProduct(prev => ({
      ...prev,
      colors: currentColors.filter(c => c !== colorToRemove)
    }));
  };

  // Add Size Variant
  const handleAddSize = () => {
    if (!newSizeInput.trim()) return;
    const currentSizes = editedProduct.sizes || [];
    if (currentSizes.includes(newSizeInput.trim())) return;
    setEditedProduct(prev => ({
      ...prev,
      sizes: [...currentSizes, newSizeInput.trim()]
    }));
    setNewSizeInput("");
  };

  // Remove Size Variant
  const handleRemoveSize = (sizeToRemove: string) => {
    const currentSizes = editedProduct.sizes || [];
    setEditedProduct(prev => ({
      ...prev,
      sizes: currentSizes.filter(s => s !== sizeToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans" id="admin-panel-root">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between" id="admin-sidebar">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-base tracking-tight">Admin Console</span>
            </div>
            <button 
              onClick={onToggleAdmin}
              className="text-slate-400 hover:text-white transition p-1 rounded-md bg-slate-800 border border-slate-700 md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-1.5" id="sidebar-nav-links">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>Dashboard Stats</span>
            </button>

            <button 
              onClick={() => setActiveTab('product')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'product' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              <span>Product Manager</span>
            </button>

            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span>Orders Tracker</span>
              {pendingOrders > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">{pendingOrders}</span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'reviews' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>Reviews Reply</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'settings' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>Store Configuration</span>
            </button>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          <button 
            onClick={onToggleAdmin}
            className="w-full py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Storefront</span>
          </button>

          <button 
            onClick={handleSaveStoreData}
            disabled={isSaving}
            className="w-full py-3 bg-amber-500 text-slate-950 font-extrabold rounded-xl text-sm hover:bg-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            id="sidebar-save-btn"
          >
            <Save className="w-4.5 h-4.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>

          {saveSuccess && (
            <div className="bg-emerald-500/20 text-emerald-300 text-[10px] text-center font-bold py-1 px-2 rounded-md border border-emerald-500/30">
              Changes persisted on disk!
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8" id="admin-main-panel">
        
        {/* Dynamic header title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-white capitalize tracking-tight flex items-center gap-2">
              <span>{activeTab} Management</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">Configure your product, reviews, settings, and track order records in real-time.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onRefresh}
              className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              id="refresh-data-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8" id="dashboard-tab">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stat-cards-grid">
              
              {/* Card 1: Total Sales Revenue */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Gross revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1" id="dash-gross-revenue">
                  {formatPrice(totalSales)}
                </div>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">✓ Real and verified orders</p>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total orders</span>
                  <ClipboardList className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1" id="dash-total-orders">
                  {orders.length}
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  {pendingOrders} pending, {completedOrders} completed
                </p>
              </div>

              {/* Card 3: Inventory Stock */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Stock level</span>
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
                <div className={`text-2xl font-black font-mono mt-1 ${product.stock <= 5 ? 'text-amber-500' : 'text-white'}`} id="dash-stock-count">
                  {product.stock} items
                </div>
                <p className={`text-[10px] font-bold mt-1 ${product.stock <= 5 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {product.stock <= 5 ? "⚠️ Low stock warning!" : "✓ Healthy inventory"}
                </p>
              </div>

              {/* Card 4: Reviews */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Average rating</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1" id="dash-avg-rating">
                  {product.rating} / 5.0
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">Based on {reviews.length} customer reviews</p>
              </div>
            </div>

            {/* Quick action section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-quick-row">
              {/* Low stock Alert */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="stock-alert-section">
                <h3 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                  <span>Real-time Inventory Status</span>
                </h3>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={editedProduct.images[0]} alt="product preview" className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{editedProduct.title}</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">Price: {formatPrice(editedProduct.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${editedProduct.stock <= 5 ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {editedProduct.stock} Left
                    </span>
                    <div className="text-[9px] text-slate-500 font-semibold mt-0.5">Current Stock</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <input 
                    type="number"
                    value={editedProduct.stock}
                    onChange={(e) => setEditedProduct({ ...editedProduct, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Enter items to add"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-xs text-white"
                  />
                  <button 
                    onClick={handleSaveStoreData}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Quick Add Stock
                  </button>
                </div>
              </div>

              {/* Promo Code Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="active-promos-dashboard">
                <h3 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  <span>Active Promo Codes</span>
                </h3>
                <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {editedPromos.map((p, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-amber-500 uppercase">{p.code}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Discount: {p.discountType === 'percentage' ? `${p.discountValue}%` : formatPrice(p.discountValue)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {p.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Product Manager */}
        {activeTab === 'product' && (
          <div className="flex flex-col gap-6" id="product-tab">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="core-product-details-form">
              <h2 className="text-lg font-black text-white mb-4 border-b border-slate-800 pb-2">Core Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Title</label>
                  <input 
                    type="text"
                    value={editedProduct.title}
                    onChange={(e) => setEditedProduct({ ...editedProduct, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tagline</label>
                  <input 
                    type="text"
                    value={editedProduct.tagline}
                    onChange={(e) => setEditedProduct({ ...editedProduct, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white italic"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sale Price ({settings.currency})</label>
                  <input 
                    type="number"
                    value={editedProduct.price}
                    onChange={(e) => setEditedProduct({ ...editedProduct, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Original Crossout Price ({settings.currency})</label>
                  <input 
                    type="number"
                    value={editedProduct.originalPrice}
                    onChange={(e) => setEditedProduct({ ...editedProduct, originalPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Delivery Charge Info</label>
                  <input 
                    type="text"
                    value={editedProduct.deliveryInfo}
                    onChange={(e) => setEditedProduct({ ...editedProduct, deliveryInfo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Warranty Info</label>
                  <input 
                    type="text"
                    value={editedProduct.warranty}
                    onChange={(e) => setEditedProduct({ ...editedProduct, warranty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <input 
                    type="text"
                    value={editedProduct.category}
                    onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white"
                  />
                </div>

                {/* AI Copywriter Section */}
                <div className="md:col-span-2 bg-amber-500/5 p-5 rounded-2xl border border-amber-500/20 mt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-extrabold text-sm uppercase tracking-wide">Gemini AI E-commerce Copywriter</span>
                  </div>
                  <p className="text-slate-400 text-xs">Let Gemini generate high-converting premium copy based on what you want to emphasize (e.g. "focus on fitness tracking and waterproof IP68 rating in Bengali style").</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Write a luxury description emphasizing AMOLED display and titanium frame..."
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button 
                      type="button"
                      onClick={handleAiCopywriterSubmit}
                      disabled={isGeneratingCopy}
                      className="px-4 py-2.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl hover:bg-amber-400 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {isGeneratingCopy ? "Generating..." : "Generate Description"}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Description</label>
                  <textarea 
                    rows={4}
                    value={editedProduct.description}
                    onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-amber-500 outline-none text-white resize-none"
                  />
                </div>

              </div>
            </div>

            {/* Product Image Selection & Config */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="product-images-manager">
              <h2 className="text-lg font-black text-white mb-2">Product Image Gallery</h2>
              <p className="text-slate-400 text-xs mb-4">Add, remove, or choose from high-quality preset smart watch imagery to show on your storefront.</p>
              
              {/* Preset selectors */}
              <div className="mb-6 flex flex-wrap gap-2.5" id="presets-panel">
                {presetWatchImages.map((p, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetImage(p.url)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Active images list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-slate-800 pt-5">
                {editedProduct.images.map((img, index) => (
                  <div key={index} className="relative bg-slate-950 p-2 border border-slate-800 rounded-xl group overflow-hidden flex flex-col items-center justify-between gap-2">
                    <img src={img} alt="product" className="w-full h-24 object-contain rounded-lg bg-slate-900" referrerPolicy="no-referrer" />
                    <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">Image {index + 1}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 p-1 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <input 
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste any custom image URL here..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
                <button 
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                >
                  Add Image URL
                </button>
              </div>
            </div>

            {/* Product Specifications Table Config */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="product-lists-manager">
              
              {/* Specs Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-extrabold text-white text-base mb-1">Product Specifications</h3>
                <p className="text-slate-400 text-xs mb-4">Edit the technical data shown to your customers.</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {editedProduct.specs.map((spec, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-500">{spec.label}:</span>{" "}
                        <span className="text-slate-300 font-medium">{spec.value}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-red-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <input 
                    type="text"
                    value={newSpecLabel}
                    onChange={(e) => setNewSpecLabel(e.target.value)}
                    placeholder="Label: Display"
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                  <input 
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Value: 1.43-inch AMOLED"
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddSpec}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                >
                  Add Specification Row
                </button>
              </div>

              {/* Highlight Features */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-extrabold text-white text-base mb-1">Product Highlights</h3>
                <p className="text-slate-400 text-xs mb-4">Manage the top benefit bullet points of the product.</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {editedProduct.features.map((feat, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium line-clamp-1">{feat}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-red-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <input 
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Type new highlight benefit..."
                  className="mt-4 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                />
                <button 
                  type="button"
                  onClick={handleAddFeature}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                >
                  Add Highlight Point
                </button>
              </div>

            </div>

            {/* Color & Size Variants Config */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" id="product-variants-manager">
              
              {/* Colors Manager */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-extrabold text-white text-base mb-1">Color Variants (রং এর তালিকা)</h3>
                <p className="text-slate-400 text-xs mb-4">Manage the available color options for your customers.</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {(editedProduct.colors || []).length === 0 ? (
                    <span className="text-slate-500 text-xs font-semibold italic">No colors defined. The product will sell as single-color.</span>
                  ) : (
                    (editedProduct.colors || []).map((color, idx) => (
                      <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{color}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="text-red-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <input 
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    placeholder="e.g. সাদা (White) or Maroon"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer font-black"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* Sizes Manager */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-extrabold text-white text-base mb-1">Size Variants (সাইজের তালিকা)</h3>
                <p className="text-slate-400 text-xs mb-4">Manage the available size options for your customers.</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {(editedProduct.sizes || []).length === 0 ? (
                    <span className="text-slate-500 text-xs font-semibold italic">No sizes defined. The product will sell as single-size.</span>
                  ) : (
                    (editedProduct.sizes || []).map((size, idx) => (
                      <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{size}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          className="text-red-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <input 
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    placeholder="e.g. 40 (M) or XL"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSize}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer font-black"
                  >
                    Add Size
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Orders Tracker */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6" id="orders-tab">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden" id="orders-manager-card">
              <h2 className="text-lg font-black text-white mb-4">Customer Orders Record</h2>
              
              {orders.length === 0 ? (
                <div className="bg-slate-950/50 text-center p-12 rounded-xl text-slate-500 font-medium">
                  No orders placed yet. As soon as customers checkout, orders will pop up here.
                </div>
              ) : (
                <div className="overflow-x-auto" id="orders-table-wrapper">
                  <table className="w-full border-collapse text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="p-4 rounded-l-xl">Order ID / Date</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Delivery Address</th>
                        <th className="p-4">Amount / Qty</th>
                        <th className="p-4">Method / Transaction</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 rounded-r-xl text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-semibold" id="orders-table-body">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <span className="font-bold text-amber-500 text-sm font-mono block">{ord.id}</span>
                            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                              {new Date(ord.orderDate).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-100">{ord.customerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ord.customerPhone}</div>
                            {ord.customerEmail && <div className="text-[9px] text-slate-500 mt-0.5">{ord.customerEmail}</div>}
                          </td>
                          <td className="p-4 max-w-xs truncate leading-normal" title={ord.customerAddress}>
                            {ord.customerAddress}
                          </td>
                          <td className="p-4">
                            <div className="font-extrabold text-white text-sm font-mono">{formatPrice(ord.totalAmount)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Quantity: {ord.quantity}</div>
                            {(ord.selectedColor || ord.selectedSize) && (
                              <div className="mt-1.5 flex flex-col gap-0.5 text-[9px] text-slate-400 font-bold bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                {ord.selectedColor && (
                                  <span>Color: <span className="text-amber-500">{ord.selectedColor}</span></span>
                                )}
                                {ord.selectedSize && (
                                  <span>Size: <span className="text-amber-500">{ord.selectedSize}</span></span>
                                )}
                              </div>
                            )}
                            {ord.promoCode && (
                              <div className="mt-1">
                                <span className="bg-slate-800 text-amber-500 text-[8px] font-bold px-1 py-0.5 rounded uppercase font-mono">{ord.promoCode}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-black text-[10px] uppercase block text-slate-200 tracking-wider">
                              {ord.paymentMethod}
                            </span>
                            {ord.transactionId && (
                              <span className="text-[9px] font-mono bg-slate-950 px-1 py-0.5 rounded text-pink-400 mt-1 block border border-pink-500/10">
                                TXN: {ord.transactionId}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                              ord.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              ord.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              ord.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <select 
                              value={ord.status}
                              onChange={(e) => handleOrderStatusUpdate(ord.id, e.target.value as Order['status'])}
                              className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Reviews Management */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6" id="reviews-tab">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="reviews-manager-card">
              <h2 className="text-lg font-black text-white mb-2">Customer Reviews & AI Replies</h2>
              <p className="text-slate-400 text-xs mb-6">Read customer testimonials, reply to them directly, or use Gemini AI to generate friendly localized responses.</p>
              
              {reviews.length === 0 ? (
                <div className="bg-slate-950/50 text-center p-12 rounded-xl text-slate-500 font-medium">
                  No reviews submitted yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4" id="admin-reviews-list">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{rev.userName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{rev.date}</span>
                          </div>
                          <div className="flex text-amber-500 gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 fill-current ${
                                  i < rev.rating ? 'text-amber-500' : 'text-slate-800'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-slate-300 text-xs italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        "{rev.comment}"
                      </p>

                      {/* Display existing reply or reply form */}
                      {rev.adminReply ? (
                        <div className="bg-slate-900/40 border-l-4 border-amber-500 p-4 rounded-r-xl flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Your Reply</span>
                          </span>
                          <p className="text-slate-400 text-xs leading-relaxed italic">
                            {rev.adminReply}
                          </p>
                          <button 
                            onClick={() => {
                              setReviewReplyInputs(prev => ({ ...prev, [rev.id]: rev.adminReply || "" }));
                              // Remove current reply in view to edit
                              handleOrderStatusUpdate(rev.id, "Pending"); // trigger refresh trigger
                              rev.adminReply = undefined; // local toggle
                            }}
                            className="text-[9px] text-slate-500 hover:text-slate-300 font-bold self-start mt-1 underline cursor-pointer"
                          >
                            Edit Reply
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">Write or Generate Response</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={reviewReplyInputs[rev.id] || ""}
                              onChange={(e) => setReviewReplyInputs({ ...reviewReplyInputs, [rev.id]: e.target.value })}
                              placeholder="Type reply or click AI Auto-Reply..."
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-medium"
                            />
                            
                            <button 
                              onClick={() => handleAiReviewReply(rev)}
                              disabled={isGeneratingReply[rev.id]}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Generate localized reply with Gemini AI"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isGeneratingReply[rev.id] ? "Thinking..." : "AI Auto-Reply"}</span>
                            </button>

                            <button 
                              onClick={() => handleReviewReplySave(rev.id)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Promo Codes & Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="settings-tab">
            
            {/* Store general configurations */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-black text-white border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>Store configurations</span>
              </h2>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Store Name / Title</label>
                <input 
                  type="text"
                  value={editedSettings.storeName}
                  onChange={(e) => setEditedSettings({ ...editedSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-semibold focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Currency</label>
                  <select 
                    value={editedSettings.currency}
                    onChange={(e) => setEditedSettings({ ...editedSettings, currency: e.target.value as 'BDT' | 'USD' })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white focus:border-amber-500 cursor-pointer font-bold"
                  >
                    <option value="BDT">BDT (৳ Taka)</option>
                    <option value="USD">USD ($ Dollar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shipping Fee</label>
                  <input 
                    type="number"
                    value={editedSettings.shippingFee}
                    onChange={(e) => setEditedSettings({ ...editedSettings, shippingFee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-mono focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Support Email Address</label>
                <input 
                  type="email"
                  value={editedSettings.supportEmail}
                  onChange={(e) => setEditedSettings({ ...editedSettings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">bKash Personal No.</label>
                  <input 
                    type="text"
                    value={editedSettings.bkashNumber || ""}
                    onChange={(e) => setEditedSettings({ ...editedSettings, bkashNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-mono focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nagad Personal No.</label>
                  <input 
                    type="text"
                    value={editedSettings.nagadNumber || ""}
                    onChange={(e) => setEditedSettings({ ...editedSettings, nagadNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-mono focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Admin Panel Passcode</label>
                <input 
                  type="password"
                  value={editedSettings.adminPasscode}
                  onChange={(e) => setEditedSettings({ ...editedSettings, adminPasscode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-mono focus:border-amber-500"
                />
              </div>
            </div>

            {/* Promo codes management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between" id="settings-promo-management">
              <div>
                <h2 className="text-lg font-black text-white mb-2 border-b border-slate-800 pb-2">Active Discount Codes</h2>
                <p className="text-slate-400 text-xs mb-4">Add or disable discount codes that users can write inside the checkout billing section.</p>
                
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {editedPromos.map((p, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-amber-500 uppercase tracking-wide">{p.code}</span>
                        <span className="text-slate-400 font-semibold">
                          Save: {p.discountType === 'percentage' ? `${p.discountValue}%` : formatPrice(p.discountValue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleTogglePromo(p.code)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${p.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                        >
                          {p.isActive ? "Enabled" : "Disabled"}
                        </button>
                        <button 
                          onClick={() => handleDeletePromo(p.code)}
                          className="text-red-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 mt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Create New Promo Code</span>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    placeholder="CODE: e.g. SAVE20"
                    className="col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase outline-none"
                  />
                  <select 
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as 'percentage' | 'fixed')}
                    className="px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="percentage">% Percent</option>
                    <option value="fixed">Fixed Flat</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(parseInt(e.target.value) || 0)}
                    placeholder="Discount Value"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                  <button 
                    onClick={handleAddPromoCode}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Add Code
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
