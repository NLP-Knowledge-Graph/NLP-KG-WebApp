export const ShimmerPublication = () => {
  return (
    <div className="py-4 w-full">
      <div className="flex-1 space-y-4 py-1 animate-pulse">
        <div className="h-4 bg-gray-600 rounded w-[90%]"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-8 gap-4">
            <div className="h-2 bg-gray-600 rounded col-span-2"></div>
            <div className="h-2 bg-gray-600 rounded col-span-3"></div>
            <div className="h-2 bg-gray-600 rounded col-span-2"></div>
            <div className="h-2 bg-gray-600 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-gray-600 rounded"></div>
          <div className="h-2 bg-gray-600 rounded"></div>
          <div className="h-2 bg-gray-600 rounded w-[60%]"></div>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="h-5 bg-primary rounded col-span-2"></div>
          <div className="col-span-2 flex">
            <div className="rounded-l bg-slate-400 w-3/4 h-5"></div>
            <div className="rounded-r bg-primary w-1/4 h-5"></div>
          </div>
          <div className="h-5 bg-slate-400 rounded col-span-2"></div>
          <div className="h-5 bg-slate-400 rounded col-span-2"></div>
          <div className="h-5 bg-slate-400 rounded col-span-2"></div>
        </div>
      </div>
    </div>
  )
}