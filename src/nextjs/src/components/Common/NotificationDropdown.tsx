import {Bell} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {api, RouterOutputs} from "~/utils/api";
import {useSession} from "next-auth/react";
import {Label} from "../ui/label";

const NotificationDropdown = () => {
  const { data: session } = useSession();
  const { data: invitations } = api.collaboration.getInvitations.useQuery(
    undefined,
    {
      enabled: session !== undefined && session !== null,
    }
  );

  if (session === undefined || session === null) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="btn btn-circle btn-ghost tooltip tooltip-bottom relative text-center flex"
          data-tip="See your invitations"
        >
          <Bell className="stroke-black" />
          {invitations !== undefined && invitations.length > 0 && (
            <span className="absolute right-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 p-1 text-xs text-black">
              {invitations.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white p-2 text-black">
        <DropdownMenuLabel>Collaboration invitations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-auto">
          {invitations?.length === 0 && "No invitations"}
          {invitations?.map((i) => (
            <CollaborationInvite key={i.list.listid} invite={i} />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;

const CollaborationInvite = ({
  invite,
}: {
  invite: RouterOutputs["collaboration"]["getInvitations"][number];
}) => {
  const utils = api.useUtils();

  const { mutate: resolveInvite } = api.collaboration.resolveInvite.useMutation(
    {
      onSettled: () => {
        utils.collaboration.getInvitations.invalidate();
        utils.bookmarklist.all.invalidate();
      },
    }
  );

  return (
    <div className="flex flex-col gap-y-4 rounded-md border p-2">
      <Label>{invite.list.name}</Label>
      <div className="flex flex-row justify-between">
        <button
          className="btn btn-outline btn-sm text-sm"
          onClick={() =>
            resolveInvite({ listid: invite.list.listid, status: "accepted" })
          }
        >
          Accept
        </button>
        <button
          className="btn btn-outline btn-sm text-sm"
          onClick={() =>
            resolveInvite({ listid: invite.list.listid, status: "declined" })
          }
        >
          Decline
        </button>
      </div>
    </div>
  );
};
