import { LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useConfirmation } from "~/context/ConfirmationDialogContext";
import { api } from "~/utils/api";

export const LeaveListButton = ({
  listid,
  name,
  userid,
}: {
  listid: string;
  name: string;
  userid: string;
}) => {
  const router = useRouter();
  const confirm = useConfirmation();

  const { mutate: leaveList } = api.collaboration.removeFromList.useMutation({
    onSuccess: () => {
      router.replace("/");
    },
  });
  return (
    <button
      className="btn btn-ghost btn-sm flex flex-row gap-x-2"
      onClick={() =>
        confirm({
          title: `Leave ${name}`,
          description: "Are you sure you want to leave this list?",
          submit: "Ok",
          cancel: "Cancel",
        }).then(() => leaveList({ listid, userid }))
      }
    >
      <LogOut />
      <span>Leave list</span>
    </button>
  );
};
