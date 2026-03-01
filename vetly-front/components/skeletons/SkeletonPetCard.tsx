export default function SkeletonPetCard() {
  return (
    <div className="animate-pulse flex items-center gap-3 p-2 rounded-xl">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded" />
    </div>
  );
}
