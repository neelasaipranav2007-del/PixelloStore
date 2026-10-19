import Link from "next/link";
import { 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  Truck, 
  RefreshCw, 
  XCircle, 
  Lock, 
  Camera, 
  Package, 
  CheckCircle2, 
  CheckSquare, 
  Printer, 
  HelpCircle 
} from "lucide-react";
import { 
  PIXELLO_TERMS_POINTS, 
  CURRENT_TERMS_VERSION, 
  TERMS_LAST_UPDATED 
} from "@/lib/termsData";

export const metadata = {
  title: "Terms & Conditions | PixelloStore",
  description: "Read the PixelloStore Terms & Conditions, Privacy Policy, Shipping, Cancellation, and Refund policies.",
};

const ICONS_MAP: Record<number, any> = {
  1: CheckSquare,
  2: Package,
  3: CheckCircle2,
  4: XCircle,
  5: RefreshCw,
  6: Camera,
  7: Lock,
  8: Printer,
  9: Truck,
  10: FileText,
};

const policies = [
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy Policy",
    description:
      "We collect your name, mobile number, and uploaded photos solely to process, prepare, and deliver your Pixello orders. Customer details and uploaded photos will be used in accordance with our Privacy Policy. We do not sell or share personal data with third parties for marketing purposes. Photos are used exclusively for customized product production and order support.",
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Shipping Policy",
    description:
      "Orders are handed over to verified delivery partners when ready. Delivery dates are estimates and may vary due to courier logistics, weather conditions, or unforeseen circumstances. Tracking information is displayed on your account tracking dashboard as soon as it becomes available.",
  },
  {
    id: "cancellation",
    icon: XCircle,
    title: "Cancellation Policy",
    description:
      "Cancellation or modification may not be possible once printing, customization, or production has started, subject to applicable law. Customers are advised to review all order details, photos, and delivery addresses carefully before payment confirmation.",
  },
  {
    id: "refund",
    icon: RefreshCw,
    title: "Refund & Replacement Policy",
    description:
      "Damaged, defective, incorrect, or eligible products will be reviewed under PixelloStore's refund and replacement policy and applicable consumer rights. Please report any transit damage or manufacturing defect promptly through official support channels with clear photographic evidence for immediate replacement or refund.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F3EE]">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#3A2B24] to-[#4A3530] py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold text-[#F2C8B5] mb-5 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#D89A86]" />
            Version {CURRENT_TERMS_VERSION} · Last updated {TERMS_LAST_UPDATED}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-[#F2C8B5] text-sm leading-relaxed max-w-xl mx-auto font-medium">
            Please read these terms carefully before using PixelloStore. By creating an account or placing an order, you confirm that you have read and agreed to these terms.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            {policies.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors border border-white/10"
              >
                {p.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#6C5C54] mb-8 font-medium">
          <Link href="/" className="hover:text-[#D89A86] transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/profile" className="hover:text-[#D89A86] transition-colors">Customer Portal</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#3A2B24] font-bold">Terms &amp; Conditions</span>
        </div>

        {/* 10 Terms & Conditions Points */}
        <section id="terms" className="mb-14 scroll-mt-20">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#EFE6DD]">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#3A2B24]">
                PixelloStore Terms &amp; Conditions
              </h2>
              <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                Core guidelines for account creation, order placement, and product delivery.
              </p>
            </div>
            <span className="text-xs font-bold text-[#D89A86] bg-[#FFF8F2] border border-[#D89A86]/30 px-3 py-1 rounded-full shrink-0">
              {PIXELLO_TERMS_POINTS.length} Key Points
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {PIXELLO_TERMS_POINTS.map((term) => {
              const Icon = ICONS_MAP[term.id] || FileText;
              return (
                <div
                  key={term.id}
                  className="bg-white border border-[#EFE6DD] rounded-2xl p-5 shadow-xs flex items-start gap-4 hover:border-[#D89A86]/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center shrink-0 mt-0.5 text-[#D89A86]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#D89A86]">
                        Point {term.id}
                      </span>
                      <span className="text-xs text-[#3A2B24] font-bold">·</span>
                      <h3 className="text-sm font-bold text-[#3A2B24]">
                        {term.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#6C5C54] leading-relaxed font-medium">
                      {term.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Policies Breakdown */}
        <section className="mb-12">
          <div className="mb-6 pb-3 border-b border-[#EFE6DD]">
            <h2 className="font-serif text-2xl font-bold text-[#3A2B24]">
              Policies Breakdown
            </h2>
            <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
              Detailed rules covering privacy, delivery, cancellation, and returns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {policies.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  id={p.id}
                  className="bg-white border border-[#EFE6DD] rounded-2xl p-6 shadow-xs flex flex-col justify-between scroll-mt-24"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#3A2B24]">
                        {p.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#6C5C54] leading-relaxed font-medium">
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EFE6DD] flex items-center justify-between text-[11px] text-[#6C5C54]">
                    <span>Policy Version: {CURRENT_TERMS_VERSION}</span>
                    <a href="#terms" className="text-[#D89A86] font-bold hover:underline">
                      Back to Terms ↑
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Support Contact Footer */}
        <div className="bg-[#FFF8F2] border border-[#D89A86]/30 rounded-3xl p-6 text-center">
          <h3 className="font-serif text-lg font-bold text-[#3A2B24] mb-1">
            Questions About Our Terms or Policies?
          </h3>
          <p className="text-xs text-[#6C5C54] mb-4 font-medium max-w-md mx-auto">
            Our team is always here to assist with photo preparation, shipping queries, or order support.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <Link
              href="/profile"
              className="bg-[#3A2B24] hover:bg-[#4A3530] text-white px-5 py-2.5 rounded-full font-bold transition-colors"
            >
              Go to Customer Portal
            </Link>
            <Link
              href="/"
              className="bg-white border border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF3EE] px-5 py-2.5 rounded-full font-bold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
