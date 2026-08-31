"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Star, 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Sparkles, 
  ThumbsUp, 
  Download, 
  RefreshCw, 
  User, 
  Package, 
  Award, 
  ArrowUpRight, 
  CornerDownRight, 
  Send,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  orderId: string;
  productName: string;
  productSize?: string;
  productImage?: string;
  rating: number;
  title: string;
  comment: string;
  tags?: string[];
  photoUrl?: string | null;
  reviewerName: string;
  reviewerEmail?: string;
  createdAt: string;
  status: string;
  featured?: boolean;
  adminReply?: string | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 5.0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    fiveStarPercentage: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | "all" | "featured">("all");
  
  // Modals
  const [replyModalReview, setReplyModalReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredReviews = reviews.filter((rev) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      rev.reviewerName.toLowerCase().includes(q) ||
      rev.productName.toLowerCase().includes(q) ||
      rev.orderId.toLowerCase().includes(q) ||
      rev.title.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (selectedRatingFilter === "featured") {
      return rev.featured;
    }
    if (typeof selectedRatingFilter === "number") {
      return rev.rating === selectedRatingFilter;
    }
    return true;
  });

  const handleToggleFeatured = async (review: ReviewItem) => {
    try {
      const nextFeatured = !review.featured;
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, featured: nextFeatured }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, featured: nextFeatured } : r));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review from the system?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: replyModalReview.id, adminReply: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedAdminReply = replyText.trim();
        setReviews(prev => prev.map(r => r.id === replyModalReview.id ? { ...r, adminReply: updatedAdminReply } : r));

        // Synchronize directly with customer profile storage & fire event
        if (typeof window !== "undefined") {
          try {
            const currentSaved = JSON.parse(localStorage.getItem("pixello_customer_reviews_v1") || "{}");
            const key = `${replyModalReview.orderId}_${replyModalReview.productName}`;
            if (currentSaved[key]) {
              currentSaved[key].adminReply = updatedAdminReply;
            } else {
              currentSaved[key] = {
                ...replyModalReview,
                adminReply: updatedAdminReply,
              };
            }
            localStorage.setItem("pixello_customer_reviews_v1", JSON.stringify(currentSaved));
            window.dispatchEvent(new CustomEvent("pixello_admin_reviews_updated"));
            window.dispatchEvent(new Event("storage"));
          } catch (e) {
            console.error("Failed to sync customer reviews storage:", e);
          }
        }

        setReplyModalReview(null);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to save admin reply:", err);
      alert("Failed to submit reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleExportReviews = () => {
    const csvHeader = "Review ID,Order ID,Product,Rating,Customer,Date,Title,Comment,Tags,Status,Featured\n";
    const csvRows = reviews.map(r => {
      const escapedComment = `"${(r.comment || '').replace(/"/g, '""')}"`;
      const escapedTitle = `"${(r.title || '').replace(/"/g, '""')}"`;
      const tagsStr = `"${(r.tags || []).join('; ')}"`;
      return `${r.id},${r.orderId},"${r.productName}",${r.rating},"${r.reviewerName}",${r.createdAt.split('T')[0]},${escapedTitle},${escapedComment},${tagsStr},${r.status},${r.featured ? 'Yes' : 'No'}`;
    }).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pixello_customer_reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#3A2B24] tracking-tight">Customer Reviews</h1>
            <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span>Live Feedback</span>
            </Badge>
          </div>
          <p className="text-sm text-[#6C5C54] mt-1 font-medium">
            Monitor, moderate, and reply to customer ratings & product reviews submitted from customer profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchReviews}
            className="rounded-full border-[#EFE6DD] text-xs font-semibold hover:bg-[#FFF8F2] flex items-center gap-1.5 h-10 px-4"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-[#D89A86]", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <Button 
            size="sm"
            onClick={handleExportReviews}
            className="btn-pixello-primary rounded-full text-xs font-bold flex items-center gap-1.5 h-10 px-5 shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Average Rating</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-[#3A2B24]">{stats.averageRating}</h3>
                <span className="text-xs font-bold text-[#6C5C54]">/ 5.0</span>
              </div>
              <div className="flex items-center text-amber-400 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "h-3.5 w-3.5",
                      i < Math.round(stats.averageRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                    )} 
                  />
                ))}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Reviews</p>
              <h3 className="text-3xl font-black text-[#3A2B24] mt-1">{stats.total}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Verified Buyers
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">5-Star Satisfaction</p>
              <h3 className="text-3xl font-black text-[#3A2B24] mt-1">{stats.fiveStarPercentage}%</h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-1">
                {stats.ratingCounts[5] || 0} top-rated reviews
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Featured Reviews</p>
              <h3 className="text-3xl font-black text-[#3A2B24] mt-1">
                {reviews.filter(r => r.featured).length}
              </h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Displayed on Storefront
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Star Breakdown & Distribution Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-xs">
        <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24] mb-4">Rating Breakdown</h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingCounts[star] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div 
                key={star} 
                className="flex items-center gap-3 text-xs cursor-pointer group"
                onClick={() => setSelectedRatingFilter(star)}
              >
                <div className="w-16 flex items-center gap-1 font-bold text-[#3A2B24] group-hover:text-[#D89A86]">
                  <span>{star}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-[#FFF8F2] border border-[#EFE6DD] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 group-hover:bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
                <div className="w-20 text-right text-xs font-semibold text-[#6C5C54]">
                  {count} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFF8F2] border border-[#EFE6DD] p-4 rounded-3xl">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Reviews", count: stats.total },
            { id: 5, label: "5 Stars", count: stats.ratingCounts[5] || 0 },
            { id: 4, label: "4 Stars", count: stats.ratingCounts[4] || 0 },
            { id: 3, label: "3 Stars", count: stats.ratingCounts[3] || 0 },
            { id: "featured", label: "✨ Featured", count: reviews.filter(r => r.featured).length },
          ].map((tab) => {
            const isSelected = selectedRatingFilter === tab.id;
            return (
              <button
                key={tab.id.toString()}
                type="button"
                onClick={() => setSelectedRatingFilter(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-[#D89A86] text-white shadow-xs"
                    : "bg-white text-[#6C5C54] hover:bg-[#FFF8F2] hover:text-[#3A2B24] border border-[#EFE6DD]"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-2 py-0.2 rounded-full text-[10px]",
                  isSelected ? "bg-white/30 text-white font-extrabold" : "bg-[#FFF8F2] text-[#6C5C54]"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6C5C54]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, product, order ID..."
            className="pl-10 pr-4 rounded-full border-[#EFE6DD] bg-white text-xs font-medium h-10 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-[#6C5C54] hover:text-[#3A2B24]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-12 text-center shadow-xs">
            <MessageSquare className="h-12 w-12 text-[#D89A86] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">No Reviews Found</h3>
            <p className="text-xs text-[#6C5C54] mt-1 max-w-sm mx-auto font-medium">
              {searchQuery ? "Try searching for a different customer name, order ID, or product." : "Customer reviews will appear here once submitted from customer order history."}
            </p>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card 
              key={review.id} 
              className={cn(
                "border rounded-3xl transition-all shadow-xs overflow-hidden",
                review.featured ? "bg-amber-50/30 border-amber-300" : "bg-white border-[#EFE6DD]"
              )}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Customer & Product Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] font-bold text-sm flex-shrink-0">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-[#3A2B24]">{review.reviewerName}</h4>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] px-2 py-0.2 rounded-full">
                          ✓ Verified Buyer
                        </Badge>
                        {review.featured && (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.2 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            <span>Featured</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6C5C54] mt-1 font-medium">
                        <Link 
                          href={`/admin/orders?search=${review.orderId}`}
                          className="font-bold text-[#D89A86] hover:underline flex items-center gap-1"
                        >
                          <span>Order #{review.orderId}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        {review.reviewerEmail && (
                          <>
                            <span>•</span>
                            <span>{review.reviewerEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-4 w-4",
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                          )} 
                        />
                      ))}
                    </div>
                    <Badge className="bg-amber-100 text-amber-900 border-none font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                      {review.rating}/5 Stars
                    </Badge>
                  </div>
                </div>

                {/* Review Body */}
                <div className="mt-4 pt-4 border-t border-[#EFE6DD] grid md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-8 space-y-3">
                    <h5 className="font-bold text-base text-[#3A2B24]">
                      "{review.title}"
                    </h5>
                    <p className="text-xs text-[#3A2B24] leading-relaxed font-medium">
                      {review.comment}
                    </p>

                    {/* Tag Chips */}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {review.tags.map((tag, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="text-[11px] bg-[#FFF8F2] border border-[#EFE6DD] text-[#3A2B24] font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Admin Reply */}
                    {review.adminReply && (
                      <div className="mt-3 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-purple-950">
                          <CornerDownRight className="h-3.5 w-3.5 text-purple-700" />
                          <span>Official Pixello Response:</span>
                        </div>
                        <p className="text-purple-900 font-medium pl-5">{review.adminReply}</p>
                      </div>
                    )}
                  </div>

                  {/* Product & Photo Thumbnails */}
                  <div className="md:col-span-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white border border-[#EFE6DD] overflow-hidden flex-shrink-0">
                        <img 
                          src={review.productImage || "/images/wooden_frame_main.png"} 
                          alt={review.productName} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h6 className="font-bold text-xs text-[#3A2B24] truncate">{review.productName}</h6>
                        <p className="text-[11px] text-[#6C5C54] mt-0.5 truncate">{review.productSize || "Standard"}</p>
                      </div>
                    </div>

                    {/* Customer Uploaded Review Photo */}
                    {review.photoUrl && (
                      <div className="pt-2 border-t border-[#EFE6DD]/80">
                        <span className="text-[10px] font-bold text-[#6C5C54] block mb-1">Customer Photo Attachment:</span>
                        <div 
                          className="relative h-16 w-16 rounded-xl overflow-hidden border border-amber-300 cursor-pointer group"
                          onClick={() => setPhotoPreviewUrl(review.photoUrl || null)}
                        >
                          <img src={review.photoUrl} alt="Review attachment" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-4 border-t border-[#EFE6DD] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFeatured(review)}
                      className={cn(
                        "rounded-full text-xs font-bold h-8 px-3.5 cursor-pointer transition-all",
                        review.featured 
                          ? "bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200" 
                          : "border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2]"
                      )}
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
                      <span>{review.featured ? "Featured on Storefront" : "Feature Review"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyModalReview(review);
                        setReplyText(review.adminReply || "");
                      }}
                      className="rounded-full text-xs font-semibold border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2] h-8 px-3.5 cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3 mr-1 text-purple-600" />
                      <span>{review.adminReply ? "Edit Reply" : "Reply to Customer"}</span>
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full h-8 px-3 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Delete Review</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ADMIN REPLY MODAL */}
      {replyModalReview && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !isSubmittingReply && setReplyModalReview(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => !isSubmittingReply && setReplyModalReview(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors"
            >
              ✕
            </button>

            <Badge className="bg-purple-100 text-purple-900 border border-purple-300 mb-2 px-3 py-0.5 rounded-full text-xs font-bold">
              Official Store Reply
            </Badge>

            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-1">
              Reply to {replyModalReview.reviewerName}
            </h3>
            <p className="text-xs text-[#6C5C54] mb-4 font-medium">
              Review: "{replyModalReview.title}" ({replyModalReview.rating}/5 Stars on {replyModalReview.productName})
            </p>

            <form onSubmit={handleSendAdminReply} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                  Your Official Response (Visible to Customer):
                </label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Thank the customer, highlight our handcrafted process, or address any concerns..."
                  rows={4}
                  className="w-full rounded-xl border border-[#EFE6DD] p-3 text-xs font-medium text-[#3A2B24] focus:ring-[#D89A86] focus:border-[#D89A86] outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-full border-[#EFE6DD] text-xs font-bold h-11"
                  onClick={() => setReplyModalReview(null)}
                  disabled={isSubmittingReply}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {isSubmittingReply ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving Reply...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Post Response</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Photo Preview Modal */}
      {photoPreviewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-4 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setPhotoPreviewUrl(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors z-10"
            >
              ✕
            </button>
            <h4 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3">Customer Uploaded Photo</h4>
            <div className="aspect-square max-h-[400px] w-full rounded-2xl overflow-hidden bg-black/5">
              <img src={photoPreviewUrl} alt="Review attachment" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
