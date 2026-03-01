export default function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 ${count <= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3 lg:grid-cols-6'} gap-4 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 p-3 rounded-xl w-12 h-12 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
