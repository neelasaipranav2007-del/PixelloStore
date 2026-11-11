import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { HamperProvider } from "@/context/HamperContext";
import { PixelloTransitionProvider } from "@/components/customer/PixelloPageTransition";
import AnimatedTabs from "@/components/customer/AnimatedTabs";
import BirthdayCelebrationModal from "@/components/customer/BirthdayCelebrationModal";

export default function Layout({ children }: { children: React.ReactNode }) { 
  return (
    <CartProvider>
      <HamperProvider>
        <WishlistProvider>
          <PixelloTransitionProvider>
            <div className="flex min-h-screen flex-col overflow-x-hidden min-w-0">
              <Navbar />
              <main className="flex-1 overflow-x-hidden min-w-0 pb-20 md:pb-0">
                {children}
              </main>
              <Footer />
              <AnimatedTabs />
              <BirthdayCelebrationModal />
            </div>
          </PixelloTransitionProvider>
        </WishlistProvider>
      </HamperProvider>
    </CartProvider>
  ); 
}
