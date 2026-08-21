"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Sparkles, Heart } from "lucide-react";

type TransitionType = "to-login" | "to-home" | "signing-out";

interface PixelloTransitionContextType {
  isTransitioning: boolean;
  transitionType: TransitionType | null;
  transitionLabel: string;
  startTransitionTo: (destination: string, type?: TransitionType, label?: string) => void;
}

const PixelloTransitionContext = createContext<PixelloTransitionContextType>({
  isTransitioning: false,
  transitionType: null,
  transitionLabel: "",
  startTransitionTo: () => {},
});

export const usePixelloTransition = () => useContext(PixelloTransitionContext);

export function PixelloTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType | null>(null);
  const [transitionLabel, setTransitionLabel] = useState<string>("");

  useEffect(() => {
    // Automatically clear transition immediately on mount & pathname changes
    setIsTransitioning(false);
    setTransitionType(null);
    setTransitionLabel("");
  }, [pathname]);

  const startTransitionTo = (destination: string, type?: TransitionType, label?: string) => {
    const determinedType: TransitionType = type || (destination.startsWith("/login") ? "to-login" : "to-home");
    setTransitionType(determinedType);

    if (label) {
      setTransitionLabel(label);
    } else {
      if (determinedType === "signing-out") {
        setTransitionLabel("EXITING PIXELLO...");
      } else if (determinedType === "to-home") {
        setTransitionLabel("WELCOME TO PIXELLO");
      } else {
        setTransitionLabel("ENTERING SIGN IN...");
      }
    }

    setIsTransitioning(true);

    // Navigate smoothly
    setTimeout(() => {
      if (typeof window !== "undefined") {
        if (window.location.pathname === destination) {
          setIsTransitioning(false);
        } else {
          router.push(destination);
        }
      }
    }, 300);

    // Guaranteed Auto-Dismiss safety timeout (never gets stuck)
    setTimeout(() => {
      setIsTransitioning(false);
      setTransitionType(null);
      setTransitionLabel("");
    }, 600);
  };

  return (
    <PixelloTransitionContext.Provider value={{ isTransitioning, transitionType, transitionLabel, startTransitionTo }}>
      {children}

      {/* GLOBAL PIXELLO BRAND TRANSITION OVERLAY */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="pixello-global-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none select-none flex flex-col items-center justify-center bg-[#F8F3EE]/95 backdrop-blur-xs"
          >
            {/* Ambient Background Radial Glow */}
            <div 
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, #FFF8F2 0%, #F8F3EE 80%)",
              }}
            />

            {/* Sparkles Floating Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[
                { top: "35%", left: "30%", delay: 0, size: 16, color: "#D89A86" },
                { top: "30%", right: "32%", delay: 0.1, size: 18, color: "#F48A8A" },
                { top: "65%", left: "35%", delay: 0.2, size: 14, color: "#D89A86" },
                { top: "60%", right: "30%", delay: 0.15, size: 16, color: "#F2C8B5" },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ top: p.top, left: p.left, right: p.right }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [0, 0.85, 0],
                    scale: [0.6, 1.2, 0.8],
                    y: [0, -15, 0]
                  }}
                  transition={{ duration: 0.7, delay: p.delay }}
                >
                  <Sparkle style={{ width: p.size, height: p.size, color: p.color }} />
                </motion.div>
              ))}
            </div>

            {/* Central Official Pixello Logo Bridge */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: transitionType === "to-home" ? 15 : -15 }}
              animate={{ 
                scale: 1.05, 
                opacity: 1, 
                y: transitionType === "to-home" ? -25 : 0 
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-3 z-10"
            >
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-[#D89A86] shadow-xl bg-white p-1 flex items-center justify-center">
                <img
                  src="/images/pixello_logo.png"
                  alt="Pixello Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="h-3.5 w-3.5 text-[#F48A8A] fill-[#F48A8A] animate-pulse" />
                <span className="font-serif-brand text-base font-bold text-[#3A2B24] tracking-wider">
                  Pixello<span className="text-[#D89A86]">Store</span>
                </span>
                <Sparkles className="h-3 w-3 text-[#D89A86]" />
              </div>

              <p className="text-[10px] font-bold text-[#D89A86] uppercase tracking-[0.2em] -mt-1">
                {transitionLabel || (transitionType === "signing-out" ? "EXITING PIXELLO..." : transitionType === "to-home" ? "WELCOME TO PIXELLO" : "ENTERING SIGN IN...")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PixelloTransitionContext.Provider>
  );
}
