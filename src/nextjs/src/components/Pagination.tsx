type PaginationsButtonProps = {
  currentPage: number;
  setCurrentPage: (num: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
};

export const PaginationButton = ({
  currentPage,
  setCurrentPage,
  hasNext,
  hasPrevious,
}: PaginationsButtonProps) => {
  const handlePrevious = () => {
    if (!hasPrevious) return;

    setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (!hasNext) return;

    setCurrentPage(currentPage + 1);
  };

  return (
    <div>
      <div className="flex flex-1 space-x-1 justify-end">
        <div
          // href="#"
          onClick={handlePrevious}
          className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer
            ${!hasPrevious
              ? "pointer-events-none text-gray-300"
              : "text-gray-700"
            }`}
        >
          <svg
            className="mr-2 h-3.5 w-3.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 5H1m0 0 4 4M1 5l4-4"
            />
          </svg>
          Previous
        </div>
        <div
          onClick={handleNext}
          className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer
            ${!hasNext ? "pointer-events-none text-gray-300" : "text-gray-700"
            }`}
        >
          Next
          <svg
            className="ml-2 h-3.5 w-3.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 5h12m0 0L9 1m4 4L9 9"
            />
          </svg>
        </div>
      </div>
    </div >
  );
};

type PaginationProps = PaginationsButtonProps & {
  totalResults: number;
};

export const Pagination = ({
  totalResults,
  ...buttonProps
}: PaginationProps) => {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing results{" "}
            <span className="font-medium">
              {1 + buttonProps.currentPage * 10}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(totalResults, 10 + buttonProps.currentPage * 10)}
            </span>
            {" "}of {totalResults}
          </p>
        </div>
        <PaginationButton {...buttonProps} />
      </div>
    </div>
  );
};
