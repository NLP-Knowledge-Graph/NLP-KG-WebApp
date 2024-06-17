export const ShimmerResearcher = () => {
  return (
    <div className="space-y-1 py-3 px-5 w-60 h-46 border-2 rounded-xl flex flex-col animate-pulse">
      <span className="bg-gray-600 w-32 h-4 rounded-sm" />
      <div className=" w-full justify-between flex text-gray-500">
        <span className="bg-gray-400 w-20 h-4 rounded-sm" />
        <span className="bg-gray-400 w-7 h-4 rounded-sm" />
      </div>
      <div className="text-sm w-full justify-between flex text-gray-500">
        <span className="bg-gray-400 w-14 h-4 rounded-sm" />
        <span className="bg-gray-400 w-6 h-4 rounded-sm" />
      </div>
      <div className="text-sm w-full justify-between flex text-gray-500">
        <span className="bg-gray-400 w-12 h-4 rounded-sm" />
        <span className="bg-gray-400 w-8 h-4 rounded-sm" />
      </div>
    </div>
  )
}