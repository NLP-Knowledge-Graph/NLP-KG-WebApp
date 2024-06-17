import {useRouter} from "next/router";
import React, {type KeyboardEvent, useEffect, useState} from "react";
import {useSearchContext} from "~/context/SearchContext";
import ChatButton from "~/components/Common/ChatButton";

export const SearchBox = () => {
  const router = useRouter();

  useEffect(() => {
    setQueryString((router.query.keyword as string) || "");
  }, [router.query.keyword]);

  // Query in parameter
  const { queryString, setQueryString } = useSearchContext();

  // The text in the search box
  const [localQueryString, setLocalQueryString] = useState(queryString);

  const handleSearchEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    setQueryString(localQueryString);

    router
      .push(
          {pathname: "/search/", query: {keyword: localQueryString.trim()}},
        undefined,
        { shallow: true }
      )
      .catch((failure) => {
        console.error("error push router", failure);
      });
  };

  const handleSearchClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setQueryString(localQueryString);

    router
      .push(
          {pathname: "/search/", query: {keyword: localQueryString.trim()}},
        undefined,
        { shallow: true }
      )
      .catch((failure) => {
        console.error("error push router", failure);
      });
  };

  const handleChatClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    router.push("/chat");
  };

  // Update when parameter changes
  useEffect(() => {
    setLocalQueryString(queryString);
  }, [queryString]);

  return (
      <div className="flex self-stretch md:w-[550px]">
          <form
              className="flex flex-1 flex-row items-center gap-x-2 rounded-lg border border-gray-300 p-2 focus-within:border-blue-500 focus-within:ring-blue-500">
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
          value={localQueryString}
          onInput={(e) => setLocalQueryString(e.currentTarget.value)}
          onKeyDown={handleSearchEnter}
          className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
          placeholder="Search Publications, Fields of Study, and more"
        />

        <div className="flex items-center">
          <button
            type="submit"
            onClick={handleSearchClick}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Search
          </button>
        </div>
      </form>
          <div className="ml-4 mt-[0px] flex items-center">
              <ChatButton/>
          </div>
    </div>
  );
};