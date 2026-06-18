export default function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-sand/30" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-brand-sand/30 rounded w-3/4" />
          <div className="h-2.5 bg-brand-sand/20 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2.5 bg-brand-sand/20 rounded w-full" />
      <div className="h-2.5 bg-brand-sand/20 rounded w-5/6" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-brand-sand/30 rounded w-20" />
        <div className="h-3 bg-brand-sand/20 rounded w-16" />
      </div>
    </div>
  );
}
