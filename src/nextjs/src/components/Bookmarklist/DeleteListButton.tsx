import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirmation } from "~/context/ConfirmationDialogContext";
import { api } from "~/utils/api";

export const DeleteListButton = ({ listid, name }: { listid: string; name: string; }) => {
    const router = useRouter();
    const confirm = useConfirmation();

    const { mutate: deleteList } = api.bookmarklist.delete.useMutation({
      onSuccess: () => {
        router.replace("/");
      },
    });
    return (
        <button
            className="btn btn-error btn-sm flex flex-row gap-x-2"
            onClick={() =>
              confirm({
                title: `Delete ${name}`,
                description: "Are you sure you want to delete this list?",
                submit: "Ok",
                cancel: "Cancel",
              }).then(() => deleteList({ listid }))
            }
          >
            <Trash />
            <span>Delete list</span>
          </button>
    )
}