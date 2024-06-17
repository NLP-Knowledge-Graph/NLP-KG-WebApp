'use client'

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { LinkIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "~/components/ui/accordion";
import InviteCollaboratorsModal from "~/components/Common/InviteCollaboratorsModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { DeleteListButton } from "./DeleteListButton";
import { LeaveListButton } from "./LeaveListButton";
import { BookmarksList } from "./BookmarksList";
import { CollaboratorsList } from "./CollaboratorsList";
import { TogglePublicButton } from "./TogglePublicButton";
import { Profile } from "~/mongodb";
import { WatchingUsers } from "./WatchingUsers";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

/**
 * Bookmarklist component shown on the /list/{id} page
 */
export default function BookmarkListComponent({ listid }: { listid: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error } = api.bookmarklist.getByID.useQuery(listid);
  const [markdown, setMarkdown] = useState(data?.bookmarklist.notes ?? ""); // Current state of the markdown notes
  const [watchingUsers, setWatchingUsers] = useState<Profile[]>([]); // Set of users currently watching this list

  useEffect(() => {
    if (
      data !== undefined &&
      data !== null &&
      data.bookmarklist.notes !== undefined
    )
      setMarkdown(data.bookmarklist.notes);
  }, [data]);

  const { mutate: updateNotes } = api.bookmarklist.updateNotes.useMutation({});

  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  api.bookmarklist.subscribeNotes.useSubscription(
    {
      listid,
      userid: session?.user.id,
    },
    {
      onData: ({ notes, users }) => {
        setMarkdown(notes);
        setWatchingUsers(users);
      },
    }
  );

  if (error)
    return (
      <div className="text-lg font-bold text-red-500">{error.message}</div>
    );

  if (data === undefined || data === null) return;

  const isListOwner =
    session !== undefined &&
    session !== null &&
    session.user.id === data.bookmarklist.userid;

  const isCollaborator =
    session !== undefined &&
    session !== null &&
    data.collaborators.map((c) => c.user.userid).includes(session.user.id);

  return (
    <div className="flex h-full flex-col justify-between p-4 md:py-8">
      <h2 className="text-xl font-bold">{data.bookmarklist.name}</h2>
      <div className="flex max-w-sm flex-row gap-x-4">
        {isListOwner ? (
          <DeleteListButton listid={listid} name={data.bookmarklist.name} />
        ) : (
          isCollaborator && (
            <LeaveListButton
              listid={listid}
              name={data.bookmarklist.name}
              userid={session.user.id}
            />
          )
        )}
        {isListOwner && (
          <TogglePublicButton
            isPublic={data.bookmarklist.public}
            listid={listid}
          />
        )}
        {data.bookmarklist.public && (
          <button
            className="btn btn-ghost btn-sm tooltip"
            data-tip="Copy URL to clipboard"
            onClick={() => {
              const origin =
                typeof window !== "undefined" && window.location.origin
                  ? window.location.origin
                  : "";

              const URL = `${origin}${router.asPath}`;
              navigator.clipboard.writeText(URL);
            }}
          >
            <LinkIcon />
          </button>
        )}
      </div>
      <div className="flex h-full w-full flex-grow flex-row gap-x-4">
        <Accordion
          type="multiple"
          className="w-1/3"
          defaultValue={["bookmarks", "collaborators"]}
        >
          <AccordionItem value="bookmarks">
            <AccordionTrigger>Bookmarks</AccordionTrigger>
            <AccordionContent className="max-h-[65vh] overflow-y-auto">
              <BookmarksList
                {...data}
                canDelete={isListOwner || isCollaborator}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="collaborators">
            <AccordionTrigger className="flex flex-row">
              <span className="flex-1 text-start ">Collaborators</span>
              {isListOwner && (
                <InviteCollaboratorsModal
                  listid={listid}
                  collaborators={[
                    ...data.collaborators.map((c) => c.user.userid),
                  ]}
                />
              )}
            </AccordionTrigger>
            <AccordionContent className="max-h-96 overflow-y-auto">
              <CollaboratorsList {...data} isListOwner={isListOwner} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div
          className="flex h-full w-full flex-col gap-y-4"
          data-color-mode="light"
        >
          <WatchingUsers
            users={watchingUsers.filter((u) => u.userid !== session?.user.id)}
          />
          {!isListOwner && !isCollaborator ? (
            <div className="max-h-full overflow-y-scroll">
              <MDPreview source={markdown} />
            </div>
          ) : (
            <MDEditor
              height={viewportSize.height - 200}
              visibleDragbar={true}
              value={markdown}
              autoFocus={true}
              preview="live"
              onChange={(value, viewUpdate) => {
                // Don't update notes if list is public and current user is not owner or collaborator
                if (
                  data.bookmarklist.public &&
                  !isListOwner &&
                  !isCollaborator
                ) {
                  return;
                }

                setMarkdown(value ?? "");
                updateNotes({ listid, notes: value ?? "" });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
