import {api} from "~/utils/api";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,} from "../ui/dialog";
import {Save} from "lucide-react";
import {Checkbox} from "../ui/checkbox";
import {Label} from "../ui/label";
import {useEffect, useState} from "react";
import {CheckedState} from "@radix-ui/react-checkbox";
import CreateListInput from "./CreateListInput";
import {useSession} from "next-auth/react";
import {BsBookmark, BsBookmarkFill} from "react-icons/bs";

type ModifyBookmarkModalProps = {
  publication: string;
};

const ModifyBookmarkModal = ({ publication }: ModifyBookmarkModalProps) => {
  const utils = api.useUtils();
  const { data: session } = useSession();
  const { data: lists } = api.bookmarklist.all.useQuery(undefined, {
    enabled: session !== undefined && session !== null,
  });
  const { data: bookmarkedLists } = api.bookmark.lists.useQuery(publication, {
    enabled: session !== undefined && session !== null,
  });
  const [checked, setChecked] = useState<string[]>(bookmarkedLists ?? []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bookmarkedLists !== undefined) setChecked(bookmarkedLists);
  }, [bookmarkedLists, open]);

  const { mutate: modifyBookmarks } = api.bookmark.modify.useMutation({
    onSuccess: () => {
      setOpen(false);
    },
    onError: () => {
      // TODO show error
    },
    onSettled: () => {
      utils.bookmark.lists.invalidate();
    },
  });

  const changeChecked = (checked: CheckedState, listid: string) => {
    setChecked((prev) => {
      if (checked === "indeterminate" || !checked)
        return [...prev.filter((bm) => bm !== listid)];
      else return [...prev, listid];
    });
  };

  if (session === undefined || session === null) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="btn btn-circle btn-ghost tooltip p-2 grid place-items-center"
          data-tip="Add this paper to a bookmark list"
        >
          {bookmarkedLists !== undefined && bookmarkedLists.length > 0 ? (
            <BsBookmarkFill size={20} />
          ) : (
            <BsBookmark size={20} />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Add paper to bookmark list</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-48 flex-col gap-y-4 overflow-auto">
          {lists?.map((l) => (
            <div className="flex flex-row items-center gap-x-2" key={l.listid}>
              <Checkbox
                id={l.listid}
                checked={checked.includes(l.listid) ?? false}
                onCheckedChange={(checked) => changeChecked(checked, l.listid)} className="text-white"
              />
              <Label htmlFor={l.listid}>{l.name}</Label>
            </div>
          ))}
        </div>
        <CreateListInput />
        <DialogFooter className="sm:justify-start">
          <button
            type="button"
            className="btn btn-primary btn-outline tooltip"
            onClick={() => modifyBookmarks({ publication, listids: checked })}
            data-tip="Save the changes"
          >
            <Save />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyBookmarkModal;
