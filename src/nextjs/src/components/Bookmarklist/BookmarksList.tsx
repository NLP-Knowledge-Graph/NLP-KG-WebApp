import {BookmarkX} from "lucide-react";
import Link from "next/link";
import {BookmarkList} from "~/mongodb";
import {Publication} from "~/utils";
import {api} from "~/utils/api";

export const BookmarksList = ({
  publications,
  bookmarklist,
  canDelete,
}: {
  publications: Publication[];
  bookmarklist: BookmarkList;
  canDelete: boolean;
}) => {
  return (
    <div className="flex max-h-full flex-col items-start gap-y-4 overflow-auto">
      {publications.length === 0 && "No bookmarks added"}
      {publications.map((p) => (
        <BookmarkItem
          key={p.elementId}
          publication={p}
          listid={bookmarklist.listid}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
};

const BookmarkItem = ({
  publication,
  listid,
  canDelete,
}: {
  publication: Publication;
  listid: string;
  canDelete: boolean;
}) => {
  const utils = api.useUtils();
  const { mutate: removeFromList } = api.bookmark.removeFromList.useMutation({
    onSettled: () => {
      utils.bookmarklist.getByID.invalidate();
    },
  });

  return (
    <div className="flex max-w-sm flex-row items-center gap-x-4">
      {canDelete && (
        <button
          className="btn btn-circle btn-ghost btn-sm tooltip tooltip-right p-1 before:z-50 before:content-[attr(data-tip)]"
          data-tip={`Remove paper from bookmark list`}
          onClick={() =>
            removeFromList({ listid, publication: publication.elementId })
          }
        >
          <BookmarkX />
        </button>
      )}
      <div className="flex flex-col gap-y-2">
        <Link
          href={`/publications/${encodeURIComponent(publication.elementId)}`}
          className="link-hover link tooltip text-left text-sm font-bold text-primary before:z-50 before:content-[attr(data-tip)]"
          data-tip={`Go to publication: ${publication.properties.publicationTitle}`}
        >
          {publication.properties.publicationTitle}
        </Link>
        <p className="text-xs">{publication.properties.publicationDate.year}</p>
        <p className="text-xs">{publication.properties.tldr}</p>
      </div>
    </div>
  );
};
