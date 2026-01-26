
import React from 'react';
import { BlogPost } from '../types';
import { CalendarIcon, UserIcon, ClockIcon, ArrowRightIcon, ShareIcon, BookmarkIcon, CopyIcon, CheckIcon } from './Icons';

interface BlogPostViewProps {
    post: BlogPost;
    onBack: () => void;
}

const BlogPostView: React.FC<BlogPostViewProps> = ({ post, onBack }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopyLink = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
            
            {/* Navigation */}
            <div className="mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-bold group w-fit"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Επιστροφή στο Blog
                </button>
            </div>

            {/* Split Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" /> {post.readTime} διάβασμα
                        </span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                        {post.title}
                    </h1>

                    <p className="text-xl text-slate-500 leading-relaxed mb-8">
                        {post.excerpt}
                    </p>

                    <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {post.author.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{post.author}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{post.date}</span>
                                <span>•</span>
                                <span>Ειδικός Συνεργάτης</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover aspect-[4/3]" />
                        <div className="absolute inset-0 ring-1 ring-black/10 rounded-[2.5rem]"></div>
                    </div>
                </div>
            </div>

            {/* Content Grid with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Main Content */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100">
                         <div 
                            className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-img:rounded-2xl prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>

                    {/* Bottom Share (Mobile) */}
                    <div className="mt-8 flex gap-4 lg:hidden">
                        <button className="flex-1 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <ShareIcon className="w-5 h-5" /> Κοινοποίηση
                        </button>
                    </div>
                </div>

                {/* Sidebar (Sticky) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        
                        {/* Author Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Σχετικα με τον Συγγραφεα</h3>
                            <div className="flex items-center gap-4 mb-4">
                                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-2xl font-bold">
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{post.author}</h4>
                                    <p className="text-teal-600 text-sm font-medium">Κτηνίατρος</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Εξειδικευμένος στην παθολογία μικρών ζώων με πολυετή εμπειρία. Αρθρογραφεί τακτικά στο Vetly για θέματα υγείας και ευζωίας.
                            </p>
                            <button className="w-full py-2 border-2 border-slate-100 rounded-xl text-slate-600 font-bold hover:border-teal-500 hover:text-teal-600 transition-colors">
                                Δείτε το προφίλ
                            </button>
                        </div>

                        {/* Share Actions */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Σας άρεσε το άρθρο;</h3>
                            <p className="text-slate-400 text-sm mb-6">Μοιραστείτε το με φίλους ή αποθηκεύστε το για αργότερα.</p>
                            
                            <div className="flex gap-2 mb-4">
                                <button 
                                    onClick={handleCopyLink}
                                    className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
                                >
                                    {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                    {copied ? 'Αντιγράφηκε' : 'Link'}
                                </button>
                            </div>
                        </div>

                        {/* Related Topics */}
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Σχετικα Θεματα</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Υγεία', 'Κουτάβι', 'Εκπαίδευση', 'Διατροφή', 'Καλοκαίρι'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-pointer hover:border-teal-400 hover:text-teal-600 transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogPostView;
