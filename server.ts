/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { AppData, Order, Review } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Setup product data file path
const DATA_FILE_PATH = path.join(process.cwd(), "product_data.json");

// Default initial data to seed the application
const DEFAULT_DATA: AppData = {
  product: {
    id: "prod-001",
    title: "প্রিমিয়াম দুবাই রেমী কটন জুব্বা",
    tagline: "অভিজাত ডিজাইন ও শতভাগ আরামদায়ক প্রিমিয়াম জুব্বা কালেকশন",
    price: 1850,
    originalPrice: 2500,
    description: "আমাদের এই প্রিমিয়াম দুবাই রেমী কটন জুব্বাটি অত্যন্ত নিখুঁত সেলাই এবং সর্বোচ্চ গুণগত মানের ফেব্রিক দিয়ে তৈরি। এটি পরিধানে অত্যন্ত আরামদায়ক এবং যেকোনো উৎসব বা ধর্মীয় অনুষ্ঠানে আপনাকে দেবে এক আভিজাত্যপূর্ণ লুক। আধুনিক ফিটিং এবং আকর্ষণীয় কলার ডিজাইনের কারণে এটি তরুণ থেকে প্রবীণ সবার পছন্দের।",
    features: [
      "শতভাগ খাঁটি দুবাই ইম্পোর্টেড রেমী কটন ফেব্রিক",
      "প্রিমিয়াম ফিনিশিং এবং অত্যন্ত নিখুঁত ডাবল সেলাই",
      "আকর্ষণীয় এমব্রয়ডারি করা কলার ও পকেট ডিজাইন",
      "রং ও টেক্সচার দীর্ঘস্থায়ী হওয়ার গ্যারান্টি",
      "সব আবহাওয়ায় আরামদায়ক ও কুঁচকে না যাওয়ার বিশেষ সুতা"
    ],
    specs: [
      { label: "ফেব্রিক (Fabric)", value: "প্রিমিয়াম ইম্পোর্টেড রেমী কটন (Premium Imported Remy Cotton)" },
      { label: "কলার স্টাইল (Collar Style)", value: "ব্যান্ড কলার উইথ এমব্রয়ডারি (Band Collar with Embroidery)" },
      { label: "পকেট (Pocket)", value: "উভয় পাশে সাইড পকেট ও বুকে হিডেন পকেট (Side pockets on both sides and hidden chest pocket)" },
      { label: "সেলাই (Stitching)", value: "ডাবল লক আন্তর্জাতিক মানের চেইন স্টিচ (Double lock international standard chain stitch)" },
      { label: "আসল দেশ (Origin)", value: "দুবাই ফেব্রিক, বাংলাদেশে তৈরি (Dubai Fabric, Tailored in Bangladesh)" },
      { label: "যত্ন (Care)", value: "হ্যান্ড ওয়াশ অথবা ড্রাই ক্লিন বাঞ্ছনীয় (Hand wash or dry clean recommended)" }
    ],
    images: [
      "https://i.ibb.co.com/ccsRXJfJ/IMG-20260707-WA0013.jpg",
      "https://i.ibb.co.com/6K7sRxK/IMG-20260119-WA0003.jpg"
    ],
    stock: 120,
    rating: 4.9,
    category: "পাঞ্জাবী ও জুব্বা (Jubbah & Punjabi)",
    deliveryInfo: "সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা (হোম ডেলিভারি ২-৩ দিন)",
    warranty: "৭ দিনের সাইজ পরিবর্তন ও শতভাগ মান গ্যারান্টি (7 Days Replacement Warranty)",
    colors: [
      "সাদা (White)",
      "নেভি ব্লু (Navy Blue)",
      "অলিভ গ্রিন (Olive Green)",
      "কালো (Black)",
      "মেরুন (Maroon)",
      "অ্যাশ গ্রে (Ash Grey)"
    ],
    sizes: [
      "40 (M)",
      "42 (L)",
      "44 (XL)",
      "46 (XXL)"
    ]
  },
  reviews: [
    {
      id: "rev-1",
      userName: "মোহাম্মদ আব্দুল্লাহ",
      rating: 5,
      comment: "জুব্বাটির কাপড় আসলেই অসাধারণ এবং অনেক আরামদায়ক। সেলাই অনেক ফিনিশিং। ২ দিনের মধ্যে ডেলিভারি পেয়েছি। ধন্যবাদ সেলারকে!",
      date: "2026-07-06",
      adminReply: "ধন্যবাদ আব্দুল্লাহ সাহেব! আপনার মূল্যবান রিভিউ পেয়ে আমরা আনন্দিত। আমাদের সর্বোচ্চ মানের ফেব্রিক ও সুনিপুণ সেলাই আশাকরি আপনার ভালো অভিজ্ঞতা ধরে রাখবে।"
    },
    {
      id: "rev-2",
      userName: "ইমরান মাহমুদ",
      rating: 5,
      comment: "আমি ৪২ সাইজের নেভি ব্লু কালার অর্ডার করেছিলাম। একদম পারফেক্ট সাইজ ও কালার ফিট হয়েছে। কাপড়টা খুব প্রিমিয়াম ফিল দেয়।",
      date: "2026-07-07"
    }
  ],
  orders: [],
  promoCodes: [
    { code: "WELCOME100", discountType: "fixed", discountValue: 100, isActive: true },
    { code: "FREE50", discountType: "fixed", discountValue: 50, isActive: true }
  ],
  settings: {
    storeName: "Porshi Bari Fashion House",
    currency: "BDT",
    shippingFee: 60,
    bkashNumber: "01825810321",
    nagadNumber: "01825810321",
    supportEmail: "porshibarifashionhouse@gmail.com",
    adminPasscode: "admin123"
  }
};

// Lazy initialize Gemini API client helper
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Read/Write helper functions
function loadData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileData = fs.readFileSync(DATA_FILE_PATH, "utf8");
      return JSON.parse(fileData);
    } else {
      // Seed initial data
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
      return DEFAULT_DATA;
    }
  } catch (error) {
    console.error("Error reading or seeding product data, using default state:", error);
    return DEFAULT_DATA;
  }
}

function saveData(data: AppData) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving product data to file:", error);
  }
}

// API Routes

// 1. Get entire app data (Product, Reviews, Orders, Promo Codes, Settings)
app.get("/api/data", (req, res) => {
  const data = loadData();
  res.json(data);
});

// 2. Update store state (Product details, Promo codes, Settings, etc.)
app.post("/api/update", (req, res) => {
  try {
    const { product, promoCodes, settings } = req.body;
    const currentData = loadData();

    if (product) currentData.product = product;
    if (promoCodes) currentData.promoCodes = promoCodes;
    if (settings) currentData.settings = settings;

    saveData(currentData);
    res.json({ success: true, message: "Settings updated successfully", data: currentData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Customer places a new order
app.post("/api/orders", (req, res) => {
  try {
    const orderData: Omit<Order, "id" | "orderDate" | "status"> = req.body;
    const currentData = loadData();

    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString(),
      status: "Pending"
    };

    // Decrease product stock if it's in stock
    if (currentData.product.stock >= orderData.quantity) {
      currentData.product.stock -= orderData.quantity;
    }

    currentData.orders.unshift(newOrder); // Add to beginning of array
    saveData(currentData);

    res.json({ success: true, order: newOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Update order status (Admin only)
app.patch("/api/orders/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentData = loadData();

    const orderIndex = currentData.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }

    currentData.orders[orderIndex].status = status;
    saveData(currentData);

    res.json({ success: true, order: currentData.orders[orderIndex] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Customer submits a review
app.post("/api/reviews", (req, res) => {
  try {
    const { userName, rating, comment } = req.body;
    const currentData = loadData();

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userName: userName || "Anonymous Customer",
      rating: rating || 5,
      comment: comment || "",
      date: new Date().toISOString().split("T")[0]
    };

    currentData.reviews.unshift(newReview);

    // Recalculate product rating average
    const totalRating = currentData.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    currentData.product.rating = parseFloat((totalRating / currentData.reviews.length).toFixed(1));

    saveData(currentData);

    res.json({ success: true, review: newReview, averageRating: currentData.product.rating });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Admin replies to a review
app.post("/api/reviews/:id/reply", (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;
    const currentData = loadData();

    const reviewIndex = currentData.reviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }

    currentData.reviews[reviewIndex].adminReply = replyText;
    saveData(currentData);

    res.json({ success: true, review: currentData.reviews[reviewIndex] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Delete a review (Admin utility)
app.delete("/api/reviews/:id", (req, res) => {
  try {
    const { id } = req.params;
    const currentData = loadData();

    const initialLength = currentData.reviews.length;
    currentData.reviews = currentData.reviews.filter(r => r.id !== id);

    if (currentData.reviews.length === initialLength) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }

    // Recalculate average rating
    if (currentData.reviews.length > 0) {
      const totalRating = currentData.reviews.reduce((sum, rev) => sum + rev.rating, 0);
      currentData.product.rating = parseFloat((totalRating / currentData.reviews.length).toFixed(1));
    } else {
      currentData.product.rating = 5.0;
    }

    saveData(currentData);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI endpoints powered by Gemini API
// A. AI Description Generator
app.post("/api/ai/generate-description", async (req, res) => {
  try {
    const { prompt, currentTitle, originalDescription } = req.body;

    const ai = getAiClient();
    const systemPrompt = "You are an expert e-commerce copywriter. Write a highly persuasive, premium e-commerce product description for a single landing page. Focus on benefits, sleek phrasing, and high-impact vocabulary. Write the response in a natural blending of English and occasional natural Bengali expressions (or purely English if requested by the prompt context) depending on the style specified. Keep it to a single clean paragraph under 120 words.";

    const promptText = `
      Product Title: ${currentTitle || "Smart Device"}
      Existing Description: ${originalDescription || "Premium e-commerce product."}
      User Instructions: ${prompt}
      Generate a premium, high-converting description. No markdown bolding of the whole text, just pure copy content.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Description Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to call Gemini API" });
  }
});

// B. AI Review Reply Generator
app.post("/api/ai/generate-reply", async (req, res) => {
  try {
    const { comment, customerName, storeName } = req.body;

    const ai = getAiClient();
    const systemPrompt = `You are a polite, helpful customer success manager for an e-commerce shop called "${storeName || "Our Store"}". Write a friendly, professional reply to a customer review. If the review is written in Bengali, reply in polite Bengali. If it is in English, reply in friendly English. Keep the reply short (1-2 sentences) and highly appreciative.`;

    const promptText = `
      Customer Name: ${customerName}
      Review: "${comment}"
      Please generate a perfect response.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Reply Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to call Gemini API" });
  }
});

// Serve Vite middleware in development or build outputs in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
