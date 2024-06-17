import { Trash, User2 } from "lucide-react";
import Image from "next/image";
import { BookmarkList } from "~/mongodb";
import { RouterOutputs, api } from "~/utils/api";

export const CollaboratorsList = ({
  collaborators,
  bookmarklist,
  isListOwner,
}: {
  collaborators: NonNullable<
    RouterOutputs["bookmarklist"]["getByID"]
  >["collaborators"];
  bookmarklist: BookmarkList;
  isListOwner: boolean;
}) => {
  return (
    <div className="flex max-h-full flex-col items-start gap-y-4 overflow-auto">
      {collaborators.length === 0 && "No collaborators added"}
      {collaborators.map((c) => (
        <CollaboratorItem
          key={c.user.userid}
          collaboration={c}
          listid={bookmarklist.listid}
          isListOwner={isListOwner}
        />
      ))}
    </div>
  );
};

const CollaboratorItem = ({
  collaboration,
  listid,
  isListOwner,
}: {
  collaboration: NonNullable<
    RouterOutputs["bookmarklist"]["getByID"]
  >["collaborators"][number];
  listid: string;
  isListOwner: boolean;
}) => {
  const utils = api.useUtils();
  const { mutate: removeFromList } =
    api.collaboration.removeFromList.useMutation({
      onSettled: () => {
        utils.bookmarklist.getByID.invalidate(listid);
      },
    });

  return (
    <div className="flex max-w-sm flex-row items-center gap-x-4">
      {isListOwner && (
        <button
          className="btn btn-circle btn-ghost btn-sm tooltip tooltip-right p-1"
          data-tip={`Delete Collaborator`}
          onClick={() =>
            removeFromList({ listid, userid: collaboration.user.userid })
          }
        >
          <Trash />
        </button>
      )}
      <div className="flex flex-row items-center gap-x-2">
        {collaboration.user.image ? (
          <Image
            alt="user profile image"
            src={collaboration.user.image}
            width={24}
            height={24}
          />
        ) : (
          <User2 />
        )}
        <span>{collaboration.user.username}</span>
        <div className="rounded-md bg-slate-200 px-2 text-sm">
          {collaboration.status}
        </div>
      </div>
    </div>
  );
};
