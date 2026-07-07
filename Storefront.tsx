/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  CheckCircle, 
  User, 
  Calendar, 
  MessageSquare, 
  Volume2, 
  Cpu, 
  Smartphone, 
  Battery, 
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppData, Order, Review } from "../types";
const logoImg = "/src/assets/images/porshi_bari_logo_1783432973530.jpg";

interface StorefrontProps {
  data: AppData;
  onRefresh: () => void;
  onToggleAdmin: () => void;
}

export default function Storefront({ data, onRefresh, onToggleAdmin }: StorefrontProps) {
  const { product, reviews, settings, promoCodes } = data;
  const [activeImage, setActiveImage] = useState(product.images[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Review Form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Checkout Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'CARD'>('COD');
  const [bkashTxnId, setBkashTxnId] = useState("");
  const [nagadTxnId, setNagadTxnId] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Variant selections
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Auto-select first color/size on mount or load
  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor("");
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize("");
    }
  }, [product.colors, product.sizes]);

  // Sync active image if product images change
  useEffect(() => {
    if (product.images.length > 0) {
      setActiveImage(product.images[0]);
    }
  }, [product.images]);

  // Handle promo code application
  const applyPromoCode = () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    const promo = promoCodes.find(p => p.code === code && p.isActive);
    if (promo) {
      setAppliedDiscount({
        code: promo.code,
        type: promo.discountType,
        value: promo.discountValue
      });
    } else {
      setPromoError(settings.currency === 'BDT' ? "প্রোমো কোডটি সঠিক নয় বা নিষ্ক্রিয়!" : "Invalid or inactive promo code!");
      setAppliedDiscount(null);
    }
  };

  // Calculations
  const basePrice = product.price * quantity;
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percentage'
      ? Math.round((basePrice * appliedDiscount.value) / 100)
      : appliedDiscount.value
    : 0;
  const subTotal = Math.max(0, basePrice - discountAmount);
  const grandTotal = subTotal + settings.shippingFee;

  // Handle Order Submit
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          quantity,
          totalAmount: grandTotal,
          promoCode: appliedDiscount?.code || "",
          paymentMethod,
          transactionId: paymentMethod === 'BKASH' ? bkashTxnId : paymentMethod === 'NAGAD' ? nagadTxnId : "",
          selectedColor,
          selectedSize
        })
      });

      const result = await response.json();
      if (result.success) {
        setLatestOrder(result.order);
        setIsSuccessOpen(true);
        setIsCheckoutOpen(false);
        // Reset form
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress("");
        setBkashTxnId("");
        setNagadTxnId("");
        setPromoInput("");
        setAppliedDiscount(null);
        setQuantity(1);
        onRefresh();
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Handle Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      alert("Please fill in your name and review text.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const result = await response.json();
      if (result.success) {
        setReviewSuccess(true);
        setReviewName("");
        setReviewComment("");
        setReviewRating(5);
        setTimeout(() => setReviewSuccess(false), 5000);
        onRefresh();
      }
    } catch (error) {
      console.error("Review Submission Error:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Format price helper
  const formatPrice = (amount: number) => {
    return settings.currency === 'BDT' 
      ? `৳${amount.toLocaleString('en-IN')}`
      : `$${amount.toFixed(2)}`;
  };

  // Dynamic feature icons helper
  const getFeatureIcon = (index: number) => {
    const icons = [
      <Smartphone className="w-5 h-5 text-amber-500" id={`feat-icon-${index}`} />,
      <Cpu className="w-5 h-5 text-amber-500" id={`feat-icon-${index}`} />,
      <Battery className="w-5 h-5 text-amber-500" id={`feat-icon-${index}`} />,
      <ShieldCheck className="w-5 h-5 text-amber-500" id={`feat-icon-${index}`} />,
      <Volume2 className="w-5 h-5 text-amber-500" id={`feat-icon-${index}`} />
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900" id="storefront-root">
      
      {/* Dynamic Promo Ribbon */}
      {promoCodes.length > 0 && promoCodes[0].isActive && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-center py-2 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm" id="promo-ribbon">
          <Sparkles className="w-4 h-4 animate-bounce" />
          <span>Use promo code <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">{promoCodes[0].code}</span> for a special discount! Offer ends soon!</span>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 py-3.5 px-4 md:px-8 shadow-sm flex items-center justify-between" id="storefront-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white p-0.5">
            <img src={logoImg} alt="Porshi Bari Logo" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
          </div>
          <span className="font-sans font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-amber-600 bg-clip-text text-transparent">
            {settings.storeName}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Social Media Links (হোয়াটসঅ্যাপ এবং ফেসবুক লিংক) */}
          <div className="flex items-center gap-2" id="header-social-links">
            <a 
              href="https://wa.me/8801825810321" // Replace with your WhatsApp Link/Number (আপনার হোয়াটসঅ্যাপ লিংক এখানে দিন)
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition border border-emerald-200/50"
              title="Chat on WhatsApp"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.01 2.01c-5.5 0-10 4.5-10 10 0 1.76.46 3.47 1.33 4.98L2 22l5.14-1.35c1.45.79 3.09 1.21 4.77 1.21 5.5 0 10-4.5 10-10s-4.41-9.85-9.9-9.85zM12 20.3c-1.57 0-3.11-.42-4.46-1.22l-.32-.19-3.32.87.89-3.23-.21-.34c-.87-1.39-1.33-3-1.33-4.67 0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.25 8.5zm4.65-6.33c-.25-.13-1.5-.74-1.73-.83-.23-.08-.39-.13-.56.13-.17.25-.65.83-.8 1-.15.17-.3.19-.55.06-2.56-1.12-3.6-2.22-4.18-3.22-.15-.25-.02-.39.11-.51.12-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.36-.77-1.87-.2-.5-.42-.42-.58-.42h-.5c-.17 0-.45.06-.68.31-.23.25-.88.87-.88 2.12 0 1.25.91 2.46 1.03 2.63.13.17 1.79 2.74 4.33 3.84.6.26 1.08.42 1.45.54.61.19 1.16.16 1.59.1.48-.07 1.5-.61 1.71-1.2.21-.58.21-1.09.15-1.2-.06-.11-.22-.17-.47-.3z" />
              </svg>
            </a>
            <a 
              href="https://facebook.com/porshibarifashionhouse" // Replace with your Facebook Page Link (আপনার ফেসবুক পেজ লিংক এখানে দিন)
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition border border-blue-200/50"
              title="Visit Facebook Page"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </a>
          </div>

          <button 
            onClick={onToggleAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full border border-slate-300 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
            id="admin-panel-btn"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </div>
      </header>

      {/* Hero Section Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12" id="storefront-main">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start" id="hero-layout">
          
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4" id="image-gallery-container">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden aspect-square relative" id="main-product-image">
              {product.originalPrice > product.price && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow" id="discount-badge">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow animate-pulse" id="stock-warning">
                  HURRY! ONLY {product.stock} LEFT
                </span>
              )}
              {product.stock === 0 && (
                <span className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xl font-bold" id="out-of-stock">
                  OUT OF STOCK
                </span>
              )}
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={activeImage} 
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 justify-center" id="thumbnail-row">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-18 h-18 rounded-xl bg-white border-2 p-1.5 flex items-center justify-center overflow-hidden shadow-sm transition-all cursor-pointer ${
                      activeImage === img ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    id={`thumb-${idx}`}
                  >
                    <img src={img} alt="thumbnail" className="object-contain max-h-full max-w-full rounded-lg" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Core Info & CTA */}
          <div className="lg:col-span-6 flex flex-col gap-6" id="product-details-container">
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md" id="product-category">
                {product.category || "Smart Gadget"}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-3" id="product-title">
                {product.title}
              </h1>
              <p className="text-amber-700 font-medium italic text-lg mt-1" id="product-tagline">
                {product.tagline}
              </p>
            </div>

            {/* Ratings & Social Proof */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs self-start" id="social-proof-bar">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 fill-current ${
                      i < Math.round(product.rating) ? 'text-amber-400' : 'text-slate-200'
                    }`} 
                  />
                ))}
              </div>
              <span className="font-bold text-sm text-slate-800">{product.rating} / 5.0</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-500">Based on {reviews.length} Customer Reviews</span>
            </div>

            {/* Price Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2" id="price-card">
              <div className="text-xs text-slate-400 font-semibold uppercase">Pricing & Value</div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-black text-slate-900" id="active-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-xl text-slate-400 line-through font-semibold" id="original-price">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                
                {/* Small Order Now button next to price */}
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-black px-4.5 py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0"
                  id="price-order-now-btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order Now (অর্ডার করুন)</span>
                </button>
              </div>
              {product.originalPrice > product.price && (
                <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  You save: {formatPrice(product.originalPrice - product.price)}!
                </div>
              )}
            </div>

            {/* Short Description */}
            <p className="text-slate-600 leading-relaxed text-base" id="product-description">
              {product.description}
            </p>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 text-sm font-semibold" id="stock-indicator">
              <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>
                {product.stock > 0 
                  ? `In Stock (${product.stock} items available)` 
                  : "Out of Stock - Coming back soon!"}
              </span>
            </div>

            {/* Purchase Control Container */}
            {product.stock > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4" id="purchase-controls-card">
                
                {/* Color Selection Variant */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-4" id="color-variant-selector">
                    <span className="font-extrabold text-slate-800 text-sm flex items-center justify-between">
                      <span>কালার সিলেক্ট করুন (Select Color):</span>
                      <span className="text-amber-600 text-xs font-black">{selectedColor}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => {
                        const isSelected = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected 
                                ? 'border-amber-500 bg-amber-500/5 text-amber-700 ring-2 ring-amber-500/20' 
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection Variant */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-4" id="size-variant-selector">
                    <span className="font-extrabold text-slate-800 text-sm flex items-center justify-between">
                      <span>সাইজ সিলেক্ট করুন (Select Size):</span>
                      <span className="text-amber-600 text-xs font-black">{selectedSize}</span>
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {product.sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                              isSelected 
                                ? 'border-amber-500 bg-amber-500/5 text-amber-700 ring-2 ring-amber-500/20' 
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-sm">Select Quantity</span>
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition cursor-pointer"
                      id="qty-decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center font-bold text-slate-800" id="qty-value">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition cursor-pointer"
                      id="qty-increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  id="checkout-trigger-btn"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Buy Now (অর্ডার করুন)</span>
                </button>

                <div className="grid grid-cols-2 gap-4 mt-2" id="trust-markers">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>{product.deliveryInfo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>{product.warranty}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Feature List Section */}
        <section className="mt-20 border-t border-slate-200 pt-16" id="features-section">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-10 tracking-tight" id="features-header">
            Why Choose {product.title}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="features-grid">
            {product.features.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4"
                id={`feature-card-${idx}`}
              >
                <div className="bg-amber-50 p-3 rounded-xl flex-shrink-0">
                  {getFeatureIcon(idx)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 mb-1.5" id={`feature-title-${idx}`}>Highlight {idx + 1}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed" id={`feature-text-${idx}`}>{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Specifications Section */}
        {product.specs && product.specs.length > 0 && (
          <section className="mt-20 bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl" id="specs-section">
            <div className="max-w-3xl mx-auto" id="specs-wrapper">
              <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8 tracking-tight" id="specs-header">
                Product Technical Specifications
              </h2>
              <div className="divide-y divide-slate-800" id="specs-table">
                {product.specs.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 py-4 gap-2 md:gap-4 items-center" id={`spec-row-${idx}`}>
                    <span className="font-bold text-slate-400 text-sm md:text-base" id={`spec-label-${idx}`}>{spec.label}</span>
                    <span className="md:col-span-2 text-slate-200 font-medium text-sm md:text-base" id={`spec-value-${idx}`}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Customer Review Section */}
        <section className="mt-20 border-t border-slate-200 pt-16" id="reviews-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="reviews-layout">
            
            {/* Left Box: Ratings and submission */}
            <div className="lg:col-span-5 flex flex-col gap-6" id="ratings-and-submission-box">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="ratings-overview-card">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Customer Sentiment</h2>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-black text-slate-900">{product.rating}</span>
                  <div className="flex flex-col">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 fill-current ${
                            i < Math.round(product.rating) ? 'text-amber-400' : 'text-slate-200'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-1">Global average rating</span>
                  </div>
                </div>
                <div className="text-slate-600 text-sm">
                  We verify all customer reviews. Submit your honest opinion to help other shoppers.
                </div>
              </div>

              {/* Review Submit Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="add-review-card">
                <h3 className="font-extrabold text-slate-900 text-lg mb-4">Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name</label>
                    <input 
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="e.g. Shakib Al Hasan"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-amber-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Feedback</label>
                    <textarea 
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your experience with the product..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition resize-none"
                    />
                  </div>

                  {reviewSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-lg text-center" id="review-success-msg">
                      Review submitted successfully! It is now live below.
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center cursor-pointer"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Box: Review lists */}
            <div className="lg:col-span-7 flex flex-col gap-6" id="reviews-list-box">
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Customer Experiences ({reviews.length})</span>
              </h3>
              
              {reviews.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[700px] pr-2" id="reviews-scroller">
                  {reviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3"
                      id={`review-item-${rev.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs uppercase border border-slate-200">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{rev.userName}</h4>
                            <div className="flex gap-0.5 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 fill-current ${
                                    i < rev.rating ? 'text-amber-400' : 'text-slate-200'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{rev.date}</span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed pl-1">
                        {rev.comment}
                      </p>

                      {/* Admin Reply */}
                      {rev.adminReply && (
                        <div className="bg-slate-50 border-l-4 border-amber-500 p-4 rounded-r-xl mt-1 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wide">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Reply from {settings.storeName}</span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed italic">
                            {rev.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-12 px-4 border-t border-slate-800 mt-20" id="storefront-footer">
        <div className="max-w-2xl mx-auto flex flex-col gap-5 items-center">
          {/* Footer Logo */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 shadow-lg flex items-center justify-center bg-white p-0.5">
            <img src={logoImg} alt="Porshi Bari Logo" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
          </div>

          <div>
            <p className="text-sm font-bold text-white uppercase tracking-wider">{settings.storeName}</p>
            <p className="text-[11px] text-amber-500 font-bold mt-1">পর্শি বাড়ি ফ্যাশন হাউস - আপনার বিশ্বস্ত ফ্যাশন পার্টনার</p>
          </div>

          {/* Social Icons inside Footer */}
          <div className="flex items-center gap-3 mt-1" id="footer-social-links">
            <a 
              href="https://wa.me/8801825810321" // Replace with your WhatsApp Link/Number (আপনার হোয়াটসঅ্যাপ লিংক এখানে দিন)
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-md hover:scale-105"
              title="Chat on WhatsApp"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.01 2.01c-5.5 0-10 4.5-10 10 0 1.76.46 3.47 1.33 4.98L2 22l5.14-1.35c1.45.79 3.09 1.21 4.77 1.21 5.5 0 10-4.5 10-10s-4.41-9.85-9.9-9.85zM12 20.3c-1.57 0-3.11-.42-4.46-1.22l-.32-.19-3.32.87.89-3.23-.21-.34c-.87-1.39-1.33-3-1.33-4.67 0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.25 8.5zm4.65-6.33c-.25-.13-1.5-.74-1.73-.83-.23-.08-.39-.13-.56.13-.17.25-.65.83-.8 1-.15.17-.3.19-.55.06-2.56-1.12-3.6-2.22-4.18-3.22-.15-.25-.02-.39.11-.51.12-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.36-.77-1.87-.2-.5-.42-.42-.58-.42h-.5c-.17 0-.45.06-.68.31-.23.25-.88.87-.88 2.12 0 1.25.91 2.46 1.03 2.63.13.17 1.79 2.74 4.33 3.84.6.26 1.08.42 1.45.54.61.19 1.16.16 1.59.1.48-.07 1.5-.61 1.71-1.2.21-.58.21-1.09.15-1.2-.06-.11-.22-.17-.47-.3z" />
              </svg>
            </a>
            <a 
              href="https://facebook.com/porshibarifashionhouse" // Replace with your Facebook Page Link (আপনার ফেসবুক পেজ লিংক এখানে দিন)
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-md hover:scale-105"
              title="Visit Facebook Page"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </a>
          </div>

          <p className="text-xs max-w-md mx-auto leading-relaxed">
            All rights reserved. Powered by premium responsive e-commerce web platform. Need help? Contact us at <a href={`mailto:${settings.supportEmail}`} className="text-amber-400 hover:underline">{settings.supportEmail}</a>
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            Secure checkout powered by SSL Encrypted Gateway (bKash, Nagad, Card, Cash on Delivery)
          </p>
        </div>
      </footer>

      {/* Interactive Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="checkout-modal">
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />

            {/* Modal Box */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col z-10"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <span className="font-extrabold text-base md:text-lg">Checkout Order Form</span>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-full hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form and product summary */}
                <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto max-h-[80vh] p-6 flex flex-col gap-6">
                  
                  {/* Item Summary Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex gap-4 items-center" id="checkout-summary-card">
                    <img src={activeImage} alt={product.title} className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200 p-1" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-950 text-sm line-clamp-1">{product.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{product.category}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 font-bold">
                        {selectedColor && (
                          <span>কালার: <span className="text-amber-600">{selectedColor}</span></span>
                        )}
                        {selectedSize && (
                          <span>সাইজ: <span className="text-amber-600">{selectedSize}</span></span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-slate-600">Qty: {quantity}</span>
                        <span className="font-extrabold text-sm text-slate-900">{formatPrice(product.price * quantity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div className="flex flex-col gap-1.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50">
                    <label className="text-xs font-bold text-slate-700 uppercase">Do you have a Promo Code?</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="e.g. WELCOME10"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-semibold tracking-wide uppercase"
                      />
                      <button 
                        type="button"
                        onClick={applyPromoCode}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedDiscount && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Promo code '{appliedDiscount.code}' applied! Saved: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : formatPrice(appliedDiscount.value)}
                      </span>
                    )}
                    {promoError && (
                      <span className="text-xs font-bold text-red-500">
                        {promoError}
                      </span>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold uppercase text-slate-500 border-b border-slate-100 pb-2 tracking-wider">Shipping & Contact Details</h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name (আপনার নাম) <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Type your full name"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number (মোবাইল নম্বর) <span className="text-red-500">*</span></label>
                        <input 
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (ইমেইল)</label>
                        <input 
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shipping Address (ডেলিভারি ঠিকানা) <span className="text-red-500">*</span></label>
                      <textarea 
                        required
                        rows={3}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="House#, Road#, Area, District"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase text-slate-500 border-b border-slate-100 pb-2 tracking-wider">Payment Method (পেমেন্ট পদ্ধতি)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Cash on Delivery */}
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          paymentMethod === 'COD' 
                            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Truck className="w-5 h-5 text-slate-700" />
                        <span className="text-xs font-bold text-slate-800">Cash on Delivery</span>
                        <span className="text-[10px] text-slate-400 font-semibold">হাতে পেয়ে টাকা দেবেন</span>
                      </button>

                      {/* bKash Payment */}
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('BKASH')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          paymentMethod === 'BKASH' 
                            ? 'border-pink-600 bg-pink-50 ring-2 ring-pink-600/10' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-pink-600 font-black text-sm">bKash</span>
                        <span className="text-xs font-bold text-slate-800">বিকাশ পেমেন্ট</span>
                        <span className="text-[10px] text-slate-400 font-semibold">bKash Send Money</span>
                      </button>

                      {/* Nagad Payment */}
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('NAGAD')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          paymentMethod === 'NAGAD' 
                            ? 'border-orange-600 bg-orange-50 ring-2 ring-orange-600/10' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-orange-600 font-black text-sm">Nagad</span>
                        <span className="text-xs font-bold text-slate-800">নগদ পেমেন্ট</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Nagad Send Money</span>
                      </button>

                      {/* Card simulation */}
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          paymentMethod === 'CARD' 
                            ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-700/10' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-blue-700 font-black text-sm">VISA / Card</span>
                        <span className="text-xs font-bold text-slate-800">কার্ড পেমেন্ট</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Simulated Gateway</span>
                      </button>

                    </div>

                    {/* bKash instructions */}
                    {paymentMethod === 'BKASH' && (
                      <div className="bg-pink-50 border border-pink-100 p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-xs text-pink-900 font-bold">
                          বিকাশ নির্দেশনা:
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          ১. নিচের নম্বরে <b>{formatPrice(grandTotal)}</b> টাকা Send Money করুন। <br />
                          বিকাশ পার্সোনাল নম্বর: <span className="bg-pink-100 px-1.5 py-0.5 rounded font-mono font-bold text-pink-700">{settings.bkashNumber || "017XXXXXXXX"}</span> <br />
                          ২. টাকা পাঠানোর পর নিচের বক্সে আপনার Transaction ID (TxnID) দিন।
                        </p>
                        <div className="mt-2">
                          <label className="block text-[10px] font-bold text-pink-950 uppercase mb-1">Transaction ID (TxnID) <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            required
                            value={bkashTxnId}
                            onChange={(e) => setBkashTxnId(e.target.value)}
                            placeholder="e.g. 8K27H10A"
                            className="w-full px-3 py-2 bg-white border border-pink-300 rounded-lg outline-none text-sm font-mono focus:ring-2 focus:ring-pink-500/20"
                          />
                        </div>
                      </div>
                    )}

                    {/* Nagad instructions */}
                    {paymentMethod === 'NAGAD' && (
                      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-xs text-orange-900 font-bold">
                          নগদ নির্দেশনা:
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          ১. নিচের নম্বরে <b>{formatPrice(grandTotal)}</b> টাকা Send Money করুন। <br />
                          নগদ পার্সোনাল নম্বর: <span className="bg-orange-100 px-1.5 py-0.5 rounded font-mono font-bold text-orange-700">{settings.nagadNumber || "019XXXXXXXX"}</span> <br />
                          ২. টাকা পাঠানোর পর নিচের বক্সে আপনার Transaction ID (TxnID) দিন।
                        </p>
                        <div className="mt-2">
                          <label className="block text-[10px] font-bold text-orange-950 uppercase mb-1">Transaction ID (TxnID) <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            required
                            value={nagadTxnId}
                            onChange={(e) => setNagadTxnId(e.target.value)}
                            placeholder="e.g. NG901827AS"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-lg outline-none text-sm font-mono focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>
                    )}

                    {/* Card instructions */}
                    {paymentMethod === 'CARD' && (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          This is a sandbox simulation. Money will <b>not</b> be deducted. Feel free to place the order to test the system!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Invoice Calculations */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 font-semibold text-slate-700 text-sm mt-2" id="invoice-bill">
                    <div className="flex justify-between">
                      <span>Subtotal (সাবটোটাল)</span>
                      <span className="text-slate-900">{formatPrice(basePrice)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount (ছাড়)</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-200 pb-2.5">
                      <span>Delivery Fee (ডেলিভারি চার্জ)</span>
                      <span className="text-slate-900">{settings.shippingFee === 0 ? "Free" : formatPrice(settings.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-extrabold text-slate-900">Total (সর্বমোট বিল)</span>
                      <span className="text-2xl font-black text-slate-950" id="grand-total">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg py-4 rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {isSubmittingOrder ? "Confirming Order..." : "Confirm Order (অর্ডার নিশ্চিত করুন)"}
                  </button>

                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessOpen && latestOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="success-modal">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsSuccessOpen(false)} />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl border border-slate-200 z-10 flex flex-col items-center gap-5"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Order Confirmed!</h2>
                  <p className="text-amber-600 font-bold text-sm mt-1">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 w-full text-left flex flex-col gap-2 font-semibold text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="text-slate-950 font-mono font-bold text-sm">{latestOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <span className="text-slate-950">{latestOrder.customerName}</span>
                  </div>
                  {latestOrder.selectedColor && (
                    <div className="flex justify-between">
                      <span>Selected Color (কালার):</span>
                      <span className="text-slate-950 font-bold">{latestOrder.selectedColor}</span>
                    </div>
                  )}
                  {latestOrder.selectedSize && (
                    <div className="flex justify-between">
                      <span>Selected Size (সাইজ):</span>
                      <span className="text-slate-950 font-bold">{latestOrder.selectedSize}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="text-slate-950 font-mono">{latestOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-slate-950 font-extrabold">{formatPrice(latestOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="text-slate-950 font-bold uppercase">{latestOrder.paymentMethod}</span>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed">
                  We will call you shortly on <b>{latestOrder.customerPhone}</b> to verify your shipping details. Delivery will take 1-3 working days. Thank you for shopping with us!
                </p>

                <button 
                  onClick={() => setIsSuccessOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition cursor-pointer"
                >
                  Back to Store
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
