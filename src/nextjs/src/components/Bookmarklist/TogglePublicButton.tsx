import { Lock, UnlockIcon } from "lucide-react";
import { api } from "~/utils/api";

export const TogglePublicButton = ({
  isPublic,
  listid,
}: {
  isPublic: boolean;
  listid: string;
}) => {
  const utils = api.useUtils();
  const { mutate: togglePublic } = api.bookmarklist.togglePublic.useMutation({
    onSettled: () => {
      utils.bookmarklist.getByID.invalidate(listid);
    },
  });

  return (
    <button
      className="btn btn-ghost btn-sm tooltip"
      data-tip={`Make this list ${isPublic ? "private" : "public"}`}
      onClick={() => togglePublic(listid)}
    >
      {isPublic ? <UnlockIcon /> : <Lock />}
    </button>
  );
};
