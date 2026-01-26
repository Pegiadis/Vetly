
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { TrendingUpIcon, UserGroupIcon, CalendarIcon, StarIcon, PieChartIcon, DollarSignIcon } from './Icons';

interface VetAnalyticsProps {
    onBack: () => void;
}

const VetAnalytics: React.FC<VetAnalyticsProps> = ({ onBack }) => {
    
    // Mock Data
    const revenueData = [
        { name: 'Ιαν', income: 2400 },
        { name: 'Φεβ', income: 1398 },
        { name: 'Μαρ', income: 9800 },
        { name: 'Απρ', income: 3908 },
        { name: 'Μαι', income: 4800 },
        { name: 'Ιουν', income: 3800 },
    ];

    const demographicsData = [
        { name: 'Σκύλοι', value: 400 },
        { name: 'Γάτες', value: 300 },
        { name: 'Άλλα', value: 100 },
    ];

    const serviceData = [
        { name: 'Εμβόλια', value: 120 },
        { name: 'Εξετάσεις', value: 200 },
        { name: 'Χειρουργεία', value: 45 },
        { name: 'Καλλωπισμοί', value: 80 },
    ];

    const COLORS = ['#0d9488', '#f59e0b', '#6366f1'];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Πίσω στο Dashboard
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Αναλυτικά Στατιστικά</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <div className="bg-green-100 p-3 rounded-xl text-green-600">
                            <DollarSignIcon className="w-6 h-6" />
                         </div>
                         <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                             <TrendingUpIcon className="w-3 h-3" /> +12.5%
                         </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">€24,500</h3>
                    <p className="text-slate-500 text-sm">Έσοδα Έτους</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                            <CalendarIcon className="w-6 h-6" />
                         </div>
                         <span className="text-indigo-500 bg-indigo-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                             <TrendingUpIcon className="w-3 h-3" /> +5.2%
                         </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">342</h3>
                    <p className="text-slate-500 text-sm">Ραντεβού</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
                            <UserGroupIcon className="w-6 h-6" />
                         </div>
                         <span className="text-teal-500 bg-teal-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                             <TrendingUpIcon className="w-3 h-3" /> +8%
                         </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">48</h3>
                    <p className="text-slate-500 text-sm">Νέοι Πελάτες</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                            <StarIcon className="w-6 h-6" />
                         </div>
                         <span className="text-slate-400 text-xs font-bold">Avg 4.9</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">4.9/5</h3>
                    <p className="text-slate-500 text-sm">Αξιολόγηση</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Revenue Chart */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Εξέλιξη Εσόδων (6 Μήνες)</h3>
                    <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="income" stroke="#6366f1" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Demographics Pie Chart */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-slate-400" />
                        Κατανομή Ασθενών
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographicsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {demographicsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Services Bar Chart */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Τύποι Υπηρεσιών</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VetAnalytics;
