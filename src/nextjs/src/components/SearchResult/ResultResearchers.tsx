import Link from "next/link";
import type {ResearcherSearch} from "~/utils/types";

type ResultResearchersProps = {
  researchers: ResearcherSearch[];
};

export const ResultResearchers = (props: ResultResearchersProps) => {
  const { researchers } = props;

  if (researchers.length === 0) {
    return <div></div>;
  }

  return (
    <div className="flex w-full flex-col space-y-3">
      {researchers.map((researcher) => {
        return (
          <Link
            key={researcher.elementId}
            href={`/researchers/${encodeURIComponent(researcher.elementId)}`}
            className="h-46 group tooltip flex w-60 flex-row items-center justify-start gap-6 rounded-xl border-2 px-5 py-2 text-left hover:bg-gray-50 focus:border-black"
            data-tip={`Go to author: ${researcher.properties.label}`}
          >
            <div className="flex w-full flex-col">
              <span className="font-semibold group-hover:underline">
                {researcher.properties.label}
              </span>
              <div className="flex w-full justify-between text-sm text-gray-500">
                <span>#publications</span>
                <span>{researcher.properties.numberOfPublications}</span>
              </div>
              <div className="flex w-full justify-between text-sm text-gray-500">
                <span>h-index</span>
                <span>{researcher.properties.hIndex}</span>
              </div>
              <div className="flex w-full justify-between text-sm text-gray-500">
                <span>citations</span>
                <span>{researcher.properties.numberOfCitations}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
