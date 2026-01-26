
import React from 'react';
import { Review } from '../types';
import { StarIcon, MessageCircleIcon } from './Icons';

interface VetReviewsProps {
    reviews: Review[];
    overallRating: number;
    reviewsCount: number;
    onBack: () => void;
}

const VetReviews: React.FC<VetReviewsProps> = ({ reviews, overallRating, reviewsCount, onBack }) => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Πίσω στο Dashboard
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Αξιολογήσεις</h1>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-lg mb-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                 
                 <div className="flex items-center gap-6 relative z-10">
                     <div className="text-6xl font-bold">{overallRating}</div>
                     <div>
                         <div className="flex text-amber-300 mb-2">
                             {[...Array(5)].map((_, i) => (
                                 <React.Fragment key={i}>
                                    <StarIcon className="w-6 h-6" fill={i < Math.floor(overallRating) ? "currentColor" : "none"} />
                                 </React.Fragment>
                             ))}
                         </div>
                         <p className="text-indigo-100 font-medium">{reviewsCount} Αξιολογήσεις συνολικά</p>
                     </div>
                 </div>
                 
                 <div className="relative z-10 text-right">
                     <p className="text-sm text-indigo-200 font-medium mb-1">Φήμη Ιατρείου</p>
                     <div className="text-2xl font-bold">Εξαιρετική</div>
                 </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-start gap-4">
                            <img src={review.userImage} alt={review.userName} className="w-12 h-12 rounded-full object-cover border-2 border-slate-50" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{review.userName}</h3>
                                        <p className="text-xs text-slate-400">{review.date}</p>
                                    </div>
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <React.Fragment key={i}>
                                                <StarIcon className="w-4 h-4" fill={i < review.rating ? "currentColor" : "none"} />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="text-slate-700 mt-3 leading-relaxed">"{review.comment}"</p>

                                {/* Actions / Reply */}
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    {review.reply ? (
                                        <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-indigo-500">
                                            <p className="text-xs font-bold text-indigo-600 mb-1">Η απάντησή σας:</p>
                                            <p className="text-sm text-slate-600">{review.reply}</p>
                                        </div>
                                    ) : (
                                        <button className="text-sm font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                                            <MessageCircleIcon className="w-4 h-4" />
                                            Απάντηση
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VetReviews;
