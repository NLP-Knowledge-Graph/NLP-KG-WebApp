/* eslint-disable @typescript-eslint/no-misused-promises */
import Link from "next/link";
import type {PropsWithChildren} from "react";
import Head from "next/head";
import {SearchBox} from "./SearchBox";
import {Toggle} from "./Toggle";
import ProfileButton from "./Common/ProfileButton";
import HierarchyButton from "~/components/Common/HierarchyGraphButton";
import BookmarkListsDropdown from "./Common/BookmarkListsDropdown";
import {useRouter} from "next/router";
import NotificationDropdown from "./Common/NotificationDropdown";

export const Layout = ({ children }: PropsWithChildren) => {
  const router = useRouter();

  if (router.pathname === "/" || router.pathname.startsWith("/auth/"))
    return children;

  return (
    <>
      <Head>
        <title>NLP Knowledge Graph</title>
        <meta
          name="description"
          content="Natural Language Processing Knowledge Graph"
        />
        <link rel="icon" href="/favicon-white.ico" />
      </Head>
      <main className="h-full">
        <div
          className="flex max-w-full flex-col items-center gap-4 bg-base-100 px-10 py-2 md:flex-row"
          id="layout"
        >
          <Link
            href="/"
            className="text-3xl font-bold text-primary"
            data-tip="Go to start page"
          >
            NLP-KG
          </Link>
          <SearchBox />
          <Toggle/>
          <HierarchyButton/>
          <div className="flex-1" />
          <div className="flex flex-row gap-4">
            <NotificationDropdown/>
            <BookmarkListsDropdown />
            <ProfileButton/>
          </div>
        </div>
        <div className="w-full">{children}</div>
      </main>
    </>
  );
};