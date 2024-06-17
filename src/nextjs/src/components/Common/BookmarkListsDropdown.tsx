import {Bookmark} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {api} from "~/utils/api";
import CreateListInput from "./CreateListInput";
import {useSession} from "next-auth/react";
import {useRouter} from "next/router";

const BookmarkListsDropdown = () => {
  const { data: session } = useSession();
  const { data: lists } = api.bookmarklist.all.useQuery(undefined, {
    enabled: session !== undefined && session !== null,
  });
  const router = useRouter();

  if (session === undefined || session === null) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="btn btn-circle btn-ghost tooltip tooltip-bottom text-center flex"
          data-tip="See your bookmark lists"
        >
          <Bookmark className="stroke-black" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className=" w-56 bg-white p-2 text-black">
        <DropdownMenuLabel>Bookmark lists</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <div className="max-h-48 overflow-auto">
          {lists?.map((l, index) => (
              <DropdownMenuItem
                  key={l.listid}
                  className={`tooltip before:z-50 before:content-[attr(data-tip)] focus:bg-primary hover:text-white ${
                      index === 0 ? "tooltip-bottom" : "" // Add tooltip-bottom only for the first item
                  }`}
                  data-tip={index === 0 ? `Go to list: ${l.name}` : `Go to list: ${l.name}`}
                  onSelect={() => router.push(`/list/${l.listid}`)}
              >
                {l.name}
              </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator/>
        <CreateListInput/>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BookmarkListsDropdown;
