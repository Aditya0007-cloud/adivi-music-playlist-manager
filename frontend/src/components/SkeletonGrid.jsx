export const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="glass h-64 animate-pulse rounded-lg p-4">
        <div className="h-36 rounded-lg bg-white/10" />
        <div className="mt-4 h-4 w-3/4 rounded bg-white/10" />
        <div className="mt-3 h-3 w-1/2 rounded bg-white/10" />
      </div>
    ))}
  </div>
);
