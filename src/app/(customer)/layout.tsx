import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { PixelloTransitionProvider } from "@/components/customer/PixelloPageTransition";

export default function Layout({ children }: { children: React.ReactNode }) { 
  return (
    <CartProvider>
      <WishlistProvider>
        <PixelloTransitionProvider>
          <div className="flex min-h-screen flex-col overflow-x-hidden min-w-0">
            <Navbar />
            <main className="flex-1 overflow-x-hidden min-w-0">
              {children}
            </main>
            <Footer />
          </div>
        </PixelloTransitionProvider>
      </WishlistProvider>
    </CartProvider>
  ); 
}
