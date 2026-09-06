import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Star, MessageSquare, CheckCircle, Send, User, ThumbsUp } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface ProductTestimonialsSectionProps {
  product: Product;
}

export const ProductTestimonialsSection: React.FC<ProductTestimonialsSectionProps> = ({ product }) => {
  const { addToast } = useApp();
  const storageKey = `aura_reviews_${product.id}`;

  const defaultReviews: ReviewItem[] = [
    {
      id: 'rev-1',
      name: 'Lakshmi Narayana',
      rating: 5,
      date: '2 days ago',
      comment: `Absolutely authentic taste! Reminds me of my grandmother's traditional home recipe in Vijayawada. The spice balance and pure oil aroma are incredible.`,
      verified: true,
    },
    {
      id: 'rev-2',
      name: 'Sravani Rao',
      rating: 5,
      date: '1 week ago',
      comment: `Ordered ${product.name} for our family function in Hyderabad. Fresh packaging, generous portion, and zero artificial aftertaste. Ordering again!`,
      verified: true,
    },
    {
      id: 'rev-3',
      name: 'Karthik V.',
      rating: 5,
      date: '2 weeks ago',
      comment: `100% genuine homemade quality. The taste and texture are unmatched compared to store-bought brands. Highly recommended!`,
      verified: true,
    },
  ];

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultReviews;
  });

  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setReviews(JSON.parse(saved));
    } else {
      setReviews(defaultReviews);
    }
  }, [product.id]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !commentText.trim()) return;

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: reviewerName.trim(),
      rating,
      date: 'Just now',
      comment: commentText.trim(),
      verified: true,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    setReviewerName('');
    setCommentText('');
    setRating(5);
    addToast('Review Submitted', 'Thank you for your feedback! Your review is now live.', 'success');
  };

  return (
    <section className="mt-12 pt-8 border-t border-neutral-200 text-left space-y-8">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-black" />
            <span>Verified Customer Feedback</span>
          </span>
          <h3 className="text-2xl font-black text-black tracking-tight mt-1">
            Customer Reviews & Testimonials ({reviews.length})
          </h3>
        </div>

        {/* Rating Summary */}
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-2xl">
          <div className="flex items-center gap-1 text-black font-extrabold">
            <Star className="w-4 h-4 fill-black text-black" />
            <span className="text-sm font-black">4.9 / 5</span>
          </div>
          <span className="text-xs text-neutral-400 font-bold">• Verified Taste Rating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: List of Testimonials */}
        <div className="lg:col-span-7 space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-2 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-black flex items-center gap-1.5">
                      <span>{rev.name}</span>
                      {rev.verified && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> Verified Buyer
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-medium">{rev.date}</span>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating ? 'fill-black text-black' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-neutral-700 font-medium leading-relaxed pt-1">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>

        {/* Right Column: Write a Review Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200 shadow-subtle space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h4 className="text-base font-extrabold text-black">Write a Testimonial</h4>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">Share your homemade taste experience with other food lovers.</p>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-bold">
            {/* Star Rating Input */}
            <div>
              <label className="block text-neutral-500 uppercase tracking-wider text-[10px] mb-1">Your Rating *</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= (hoverRating || rating) ? 'fill-black text-black' : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-extrabold text-black ml-2">{hoverRating || rating} Stars</span>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-neutral-500 uppercase tracking-wider text-[10px] mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full p-3 rounded-2xl border border-neutral-200 text-xs font-bold focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-neutral-500 uppercase tracking-wider text-[10px] mb-1">Your Review / Comment *</label>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tell us about the flavor, freshness, spice level, or memory..."
                className="w-full p-3 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Post Testimonial</span>
            </button>
          </form>
        </div>

      </div>

    </section>
  );
};
