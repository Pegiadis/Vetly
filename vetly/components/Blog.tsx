
import React, { useState } from 'react';
import { BlogPost } from '../types';
import { ArrowRightIcon, CalendarIcon, UserIcon, ClockIcon, SearchIcon, FilterIcon } from './Icons';

interface BlogProps {
    posts: BlogPost[];
    onReadPost: (post: BlogPost) => void;
}

const CATEGORIES = ['Όλα', 'Υγεία', 'Διατροφή', 'Εκπαίδευση', 'Πρόληψη', 'Lifestyle'];

const Blog: React.FC<BlogProps> = ({ posts, onReadPost }) => {
    const [selectedCategory, setSelectedCategory] = useState('Όλα');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter logic
    const filteredPosts = posts.filter(post => {
        const matchesCategory = selectedCategory === 'Όλα' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Layout logic: First 3 are "Featured" (if available), rest are "Latest"
    const featuredMain = filteredPosts[0];
    const featuredSide = filteredPosts.slice(1, 3);
    const latestPosts = filteredPosts.slice(3);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">Vetly Magazine</h1>
                    <p className="text-lg text-slate-500">Οδηγός φροντίδας και ευζωίας για το κατοικίδιό σας.</p>
                </div>
                
                {/* Search */}
                <div className="relative w-full md:w-72">
                    <input 
                        type="text" 
                        placeholder="Αναζήτηση άρθρων..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-4 mb-10 gap-2 no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Featured Grid (Magazine Style) */}
            {filteredPosts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    
                    {/* Main Featured Article (Left 2/3) */}
                    {featuredMain && (
                        <div 
                            onClick={() => onReadPost(featuredMain)}
                            className="lg:col-span-2 group cursor-pointer relative rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all h-[400px] lg:h-[500px]"
                        >
                            <img 
                                src={featuredMain.image} 
                                alt={featuredMain.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {featuredMain.category}
                                    </span>
                                    <span className="text-slate-300 text-xs font-bold flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" /> {featuredMain.readTime}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-teal-300 transition-colors">
                                    {featuredMain.title}
                                </h2>
                                <p className="text-slate-300 line-clamp-2 text-sm md:text-base max-w-2xl mb-4">
                                    {featuredMain.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-3 h-3" />
                                    </div>
                                    {featuredMain.author}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Side Featured Articles (Right 1/3 - Stacked) */}
                    <div className="flex flex-col gap-8">
                        {featuredSide.map(post => (
                            <div 
                                key={post.id}
                                onClick={() => onReadPost(post)}
                                className="flex-1 group cursor-pointer relative rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all min-h-[200px]"
                            >
                                <img 
                                    src={post.image} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <span className="text-teal-400 text-xs font-bold uppercase tracking-wide mb-2 block">
                                        {post.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-white leading-snug group-hover:underline decoration-teal-400 underline-offset-4">
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Latest Articles List */}
            {latestPosts.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                        Πρόσφατη Αρθρογραφία
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-8">
                        {latestPosts.map(post => (
                            <div 
                                key={post.id}
                                onClick={() => onReadPost(post)}
                                className="group bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-center"
                            >
                                <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden shrink-0 relative">
                                    <img 
                                        src={post.image} 
                                        alt={post.title} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                     <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-800">
                                        {post.category}
                                    </div>
                                </div>
                                
                                <div className="flex-1 py-2 pr-4">
                                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {post.date}</span>
                                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {post.readTime}</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">
                                        {post.title}
                                    </h4>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <UserIcon className="w-3 h-3" /> {post.author}
                                        </span>
                                        <span className="text-teal-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Διαβάστε <ArrowRightIcon className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredPosts.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-500">Δεν βρέθηκαν άρθρα</h3>
                    <p className="text-slate-400">Δοκιμάστε διαφορετική κατηγορία ή όρο αναζήτησης.</p>
                </div>
            )}
        </div>
    );
};

export default Blog;
