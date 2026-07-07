/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppData } from "./types";
import Storefront from "./components/Storefront";
import AdminPanel from "./components/AdminPanel";
import { Lock, AlertCircle, ShoppingBag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View mode
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  // Fetch store data
  const fetchStoreData = async () => {
    try {
      const response = await fetch("/api/data");
      if (!response.ok) {
        throw new Error("Failed to load store data from full-stack server.");
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setError(err.message || "Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  // Handle Passcode Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (passcodeInput === data.settings.adminPasscode) {
      setIsAdmin(true);
      setIsPasscodeModalOpen(false);
      setPasscodeInput("");
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans p-6" id="loading-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center max-w-sm"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <ShoppingBag className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Loading Premium E-commerce...</h2>
            <p className="text-slate-400 text-xs mt-1">Booting database and product configurator.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans p-6" id="error-screen">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Server Connection Error</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              We couldn't connect to the full-stack server backend. Please make sure the dev server started successfully.
            </p>
            {error && (
              <code className="block bg-slate-950 p-3 rounded-xl border border-slate-800 text-red-400 text-xs mt-4 overflow-x-auto text-left max-w-full font-mono">
                {error}
              </code>
            )}
          </div>
          <button 
            onClick={() => { setLoading(true); fetchStoreData(); }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-sm transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen">
      <AnimatePresence mode="wait">
        {isAdmin ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel 
              data={data} 
              onRefresh={fetchStoreData} 
              onToggleAdmin={() => setIsAdmin(false)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="store"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Storefront 
              data={data} 
              onRefresh={fetchStoreData} 
              onToggleAdmin={() => setIsPasscodeModalOpen(true)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passcode Protection Modal */}
      <AnimatePresence>
        {isPasscodeModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="passcode-modal">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setIsPasscodeModalOpen(false)} />
            
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl z-10 flex flex-col items-center gap-5"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-white">Enter Administrator Passcode</h3>
                  <p className="text-slate-400 text-xs mt-1">Authenticating securely to configure store state.</p>
                </div>

                <form onSubmit={handleUnlockAdmin} className="w-full flex flex-col gap-4">
                  <div>
                    <input 
                      type="password"
                      required
                      autoFocus
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="Enter admin passcode"
                      className={`w-full text-center px-4 py-3 bg-slate-950 border rounded-xl text-sm outline-none font-mono text-white tracking-widest focus:ring-2 ${
                        passcodeError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                    {passcodeError ? (
                      <span className="text-red-500 text-[10px] font-bold block mt-1.5 uppercase tracking-wide">Incorrect Passcode! Try again.</span>
                    ) : (
                      <span className="text-slate-500 text-[10px] font-bold block mt-1.5 uppercase tracking-wide">
                        Tip: Default passcode is <b className="text-amber-500/80">admin123</b>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button 
                      type="button"
                      onClick={() => { setIsPasscodeModalOpen(false); setPasscodeInput(""); }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                    >
                      Unlock Panel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
