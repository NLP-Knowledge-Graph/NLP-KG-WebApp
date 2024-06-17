import Link from "next/link";

type InlineResearcherListProps = {
  authorList: string[];
  authorIdList: string[];
};
export const InlineResearcherList = ({
  authorList,
  authorIdList,
}: InlineResearcherListProps) => {
  if (authorList.length === 0 || authorIdList === undefined) return null;

  return (
    <>
      {authorIdList.map((authorId, index) => {
        const authorName = authorList[index];
        return (
          <Link
            href={`/researchers/${encodeURIComponent(authorId)}`}
            key={`${authorId}${index + 1}`}
            className="tooltip text-left"
            data-tip={`Go to author: ${authorName ?? ""}`}
          >
            <span className="link">{authorName}</span>
            {index < authorIdList.length - 1 && <>,&nbsp;</>}
          </Link>
        );
      })}
    </>
  );
};
