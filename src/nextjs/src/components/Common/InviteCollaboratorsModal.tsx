import { Plus, Send, User2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { Profile } from "~/mongodb";
import { RouterOutputs, api } from "~/utils/api";
import Image from "next/image";
import { Label } from "../ui/label";
import { useDebounce } from "use-debounce";

type InviteCollaboratorsModalProps = {
  listid: string;
  collaborators: string[];
};

const InviteCollaboratorsModal = ({
  listid,
  collaborators,
}: InviteCollaboratorsModalProps) => {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<
    RouterOutputs["profile"]["search"]
  >([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);

  const { data: profiles, isLoading } = api.profile.search.useQuery(
    {
      query: debouncedQuery,
      useridfilter: [...collaborators, ...inviteUsers.map((u) => u.userid)],
    },
    {
      enabled: debouncedQuery !== "",
    }
  );

  const { mutate: createInvites } = api.collaboration.createInvites.useMutation(
    {
      onSuccess: () => {
        // TODO
        setOpen(false);
      },
      onError: () => {
        // TODO
      },
      onSettled: () => {
        utils.bookmarklist.getByID.invalidate(listid);
      },
    }
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setInviteUsers([]);
        setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Plus
          className="btn btn-circle btn-ghost tooltip h-6 w-6 transition-none"
          data-tip="Invite collaborators"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        />
      </DialogTrigger>
      <DialogContent
        className="bg-white"
        onClick={(e) => e.stopPropagation()}
        overlayProps={{ onClick: (e) => e.stopPropagation() }}
      >
        <DialogHeader>
          <DialogTitle>Invite collabortors to this list</DialogTitle>
        </DialogHeader>

        <form className="self-stretch">
          <div className="flex flex-row items-center gap-x-4 rounded-lg border border-gray-300 p-2 focus-within:border-blue-500 focus-within:ring-blue-500">
            <div className="pointer-events-none inset-y-0 left-0 flex items-center">
              <svg
                className="h-4 w-4 text-black"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              value={query}
              onInput={(e) => setQuery(e.currentTarget.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
              placeholder="Search users..."
            />
          </div>
        </form>

        {!isLoading && (
          <div className="flex max-h-32 flex-col gap-y-2">
            {profiles === undefined || profiles.length === 0 ? (
              "No matching users"
            ) : (
              <>
                {profiles.map((p) => (
                  <div key={p.userid} className="flex flex-row gap-x-4">
                    <ProfileItem profile={p} />
                    <button
                      onClick={() =>
                        setInviteUsers((prevUsers) => [...prevUsers, p])
                      }
                    >
                      <Plus />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <Label className="mt-4">Invite users</Label>
        <div className="flex max-h-32 flex-col gap-y-2">
          {inviteUsers.map((p) => (
            <div key={p.userid} className="flex flex-row gap-x-4">
              <ProfileItem profile={p} />
              <button
                onClick={() => setInviteUsers((prevUsers) => [...prevUsers.filter(u => u.userid !== p.userid)])}
              >
                <X />
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-start">
          <button
            type="button"
            className="btn btn-primary btn-outline tooltip"
            onClick={() =>
              createInvites({ listid, users: inviteUsers.map((u) => u.userid) })
            }
            data-tip="Invite users"
          >
            <Send />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorsModal;

const ProfileItem = ({
  profile,
}: {
  profile: RouterOutputs["profile"]["search"][number];
}) => {
  return (
    <div className="flex flex-row items-center gap-x-2">
      {profile.image ? (
        <Image
          alt="user profile image"
          src={profile.image}
          width={24}
          height={24}
        />
      ) : (
        <User2 />
      )}
      <span>{profile.username}</span>
    </div>
  );
};
