
import React from 'react';
import { Pet } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { XIcon, ActivityIcon } from './Icons';

interface PetHealthChartsProps {
    pet: Pet;
    onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                <p className="font-bold text-slate-700 text-sm mb-1">{label}</p>
                <p className="text-teal-600 font-bold text-lg">
                    {payload[0].value} kg
                </p>
            </div>
        );
    }
    return null;
};

const PetHealthCharts: React.FC<PetHealthChartsProps> = ({ pet, onClose }) => {
    // Use weightHistory if available, otherwise mock empty
    const data = pet.weightHistory || [];
    
    // Calculate stats
    const currentWeight = pet.weight;
    const initialWeight = data.length > 0 ? data[0].weight : currentWeight;
    const change = currentWeight - initialWeight;
    const changePercent = initialWeight > 0 ? (change / initialWeight) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                         <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
                             <ActivityIcon className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="font-bold text-xl text-slate-800">Στατιστικά Υγείας</h3>
                             <p className="text-slate-500 text-sm">Πορεία βάρους για {pet.name}</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Τρεχον Βαρος</p>
                            <p className="text-2xl font-bold text-slate-800">{currentWeight} <span className="text-sm font-medium text-slate-500">kg</span></p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Αρχικο Βαρος</p>
                            <p className="text-2xl font-bold text-slate-800">{initialWeight} <span className="text-sm font-medium text-slate-500">kg</span></p>
                        </div>
                        <div className={`p-4 rounded-2xl border text-center ${change >= 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                            <p className={`text-xs font-bold uppercase mb-1 ${change >= 0 ? 'text-green-600' : 'text-amber-600'}`}>Μεταβολη</p>
                            <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)} <span className="text-sm font-medium">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-[300px] w-full bg-white rounded-xl">
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickMargin={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="weight" 
                                        stroke="#0d9488" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorWeight)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ActivityIcon className="w-10 h-10 mb-2 text-slate-300" />
                                <p>Δεν υπάρχουν δεδομένα ιστορικού βάρους.</p>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-center text-xs text-slate-400 mt-4">
                        * Τα δεδομένα προέρχονται από τις καταχωρήσεις στις επισκέψεις και το προφίλ του ζώου.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PetHealthCharts;
