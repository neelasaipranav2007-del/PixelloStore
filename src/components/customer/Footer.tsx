import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#EFE6DD] bg-[#3A2B24] text-white">
      <div className="container mx-auto px-4 py-16 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-full lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#D89A86] bg-white">
                <img src="/images/pixello_logo.png" alt="Pixello Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-serif-brand text-2xl font-bold text-white tracking-tight">
                Pixello
              </span>
            </Link>
            <p className="max-w-xs text-sm text-slate-300 leading-relaxed mb-6">
              Every Memory Deserves a Beautiful Frame. Connecting you with nearby verified photo studios for handcrafted gifts delivered in hours.
            </p>
            <div className="text-xs text-[#D89A86] font-medium tracking-widest uppercase">
              Frames • Memories • Thoughtfully Yours
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h3 className="mb-4 font-serif-brand text-base font-bold text-[#F2C8B5]">Products</h3>
            <ul className="grid gap-2.5 text-sm text-slate-300">
              <li><Link href="/products" className="hover:text-[#D89A86] transition-colors font-medium">All Products</Link></li>
              <li><Link href="/products?category=Frames" className="hover:text-[#D89A86] transition-colors font-medium">Photo Frames</Link></li>
              <li><Link href="/products?category=Polaroids" className="hover:text-[#D89A86] transition-colors font-medium">Polaroid Prints</Link></li>
              <li><Link href="/products?category=Gifts" className="hover:text-[#D89A86] transition-colors font-medium">Gifts & Lamps</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h3 className="mb-4 font-serif-brand text-base font-bold text-[#F2C8B5]">Partnerships</h3>
            <ul className="grid gap-2.5 text-sm text-slate-300">
              <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer" className="hover:text-[#D89A86] transition-colors font-medium">Campus Ambassador Form</a></li>
              <li><Link href="/studio" className="hover:text-[#D89A86] transition-colors">Photo Studio Partner</Link></li>
              <li><Link href="/delivery" className="hover:text-[#D89A86] transition-colors">Delivery Fleet</Link></li>
              <li><Link href="/admin" className="hover:text-[#D89A86] transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h3 className="mb-4 font-serif-brand text-base font-bold text-[#F2C8B5]">Customer Care</h3>
            <ul className="grid gap-2.5 text-sm text-slate-300">
              <li><Link href="/cart" className="hover:text-[#D89A86] transition-colors">Shopping Cart</Link></li>
              <li><Link href="/wishlist" className="hover:text-[#D89A86] transition-colors">My Wishlist</Link></li>
              <li><Link href="/profile" className="hover:text-[#D89A86] transition-colors">Track Orders</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-700/60 pt-8 sm:flex-row text-xs text-slate-400">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} Pixello. Made with <Heart className="h-3 w-3 text-[#F48A8A] fill-[#F48A8A]" /> for memories.
          </p>
          <div className="mt-4 flex gap-6 sm:mt-0 items-center">
            <Link 
              href="https://instagram.com/pixellostore" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#F2C8B5] transition-colors font-bold text-sm flex items-center gap-2"
            >
              <svg className="h-4 w-4 fill-current text-[#F2C8B5]" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </Link>

            <Link 
              href="https://wa.me/918074589949" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#5AAE7F] transition-colors font-bold text-sm flex items-center gap-2"
            >
              <svg className="h-4 w-4 fill-emerald-400" viewBox="0 0 24 24">
                <path d="M12.031 2c-5.514 0-9.985 4.471-9.985 9.985 0 1.763.459 3.484 1.332 5.003l-1.417 5.176 5.297-1.389c1.464.799 3.111 1.218 4.773 1.218 5.514 0 9.985-4.471 9.985-9.985 0-2.667-1.038-5.174-2.925-7.061s-4.394-2.947-7.06-2.947zm0 1.75c2.197 0 4.262.856 5.812 2.406s2.406 3.615 2.406 5.812c0 4.541-3.696 8.235-8.235 8.235-1.492 0-2.956-.403-4.234-1.164l-.304-.181-3.146.824.838-3.063-.198-.315c-.838-1.332-1.282-2.873-1.282-4.453 0-4.54 3.696-8.235 8.235-8.235zm-3.522 3.864c-.147 0-.324.055-.494.249-.17.194-.652.637-.652 1.554 0 .917.667 1.802.76 1.927s1.312 2.003 3.18 2.809c.444.192.791.306 1.062.392.447.142.854.122 1.176.074.359-.053 1.103-.451 1.26-.887.157-.436.157-.81.11-.887-.047-.077-.17-.123-.359-.218s-1.103-.544-1.273-.606-.295-.093-.418.093c-.123.186-.475.606-.583.73-.108.124-.216.14-.405.047s-.799-.294-1.522-.939c-.563-.502-.943-1.122-1.054-1.312s-.012-.293.082-.387c.085-.084.188-.218.283-.327.094-.109.125-.187.188-.311.062-.124.031-.233-.016-.327s-.418-1.008-.573-1.38c-.151-.362-.304-.313-.418-.318z"/>
              </svg>
              WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
