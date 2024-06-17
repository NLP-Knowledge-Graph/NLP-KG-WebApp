export const ShimmerField = () => {
  return (
    <div className="w-52 h-9 border-2 rounded-xl flex flex-row [&>*]:px-2 [&>*]:py-1 [&>*]:flex [&>*]:items-center animate-pulse">
      <div
        className="border-r-2">
        <span className="bg-gray-600 w-8 h-3 rounded-sm" />
      </div>
      <div
        className="border-r-2">
        <span className="bg-gray-600 w-24 h-3 rounded-sm" />
      </div>
      <div>
        <span className="bg-gray-600 w-5 h-3 rounded-sm" />
      </div>
    </div>)
}