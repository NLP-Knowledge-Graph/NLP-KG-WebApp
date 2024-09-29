import {NextPage} from "next";
import Head from 'next/head';
import {useRouter} from "next/router";
import {SearchBox} from "~/components/SearchBox";
import {Toggle} from "~/components/Toggle";
import BookmarkListsDropdown from "~/components/Common/BookmarkListsDropdown";
import NotificationDropdown from "~/components/Common/NotificationDropdown";
import ProfileButton from "~/components/Common/ProfileButton";
import HierarchyButton from "~/components/Common/HierarchyGraphButton";
import getConfig from "next/config";
import Link from "next/link";
import GoogleAnalytics from "~/components/GoogleAnalytics";

const Home: NextPage = () => {
  const router = useRouter();
  const { publicRuntimeConfig } = getConfig();
  const currentYear = new Date().getFullYear();

  return (
      <div className="flex flex-col h-screen bg-base-200 relative">
      {/* Head */}
      <Head>
        <title>NLP Knowledge Graph</title>
        <meta
            name="description"
            content="Natural Language Processing Knowledge Graph"
        />
        <link rel="icon" href="/favicon-white.ico"/>
      </Head>
          <GoogleAnalytics/>
          {/* Feedback Banner
          <div className="bg-primary text-white text-center py-2 absolute top-0 left-0 w-full z-10">
              <p>
                  Share your <a href="https://forms.gle/3AiMK9wNzPnzvvwu8" className="underline">feedback</a> for a
                  chance to win up to 100€ 🎉
              </p>
          </div>
          */}

      {/* Main Section (if Feedback Banner is used, set top-8 mt-4) */}
          <main className="flex-grow flex justify-center items-center">
              <div className="absolute right-0 top-0 mt-4 mr-8 flex flex-row items-center gap-x-4">
          <HierarchyButton/>
          <NotificationDropdown/>
          <BookmarkListsDropdown/>
          <ProfileButton/>
        </div>
              <div className="hero text-center">
                  <div className="hero-content">
            <div>
              <h1 className="text-5xl font-bold text-primary">NLP-KG</h1>
              <p className="py-6">
                Explore Scholarly Entities in Natural Language Processing
              </p>
              <div className="flex flex-row justify-center">
                <SearchBox/>
              </div>
              <div className="mt-4 flex flex-row justify-center">
                <Toggle/>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
          <footer
              className="footer footer-center p-0 bg-base-200 text-base-content rounded absolute bottom-2 left-0 w-full z-10">
        <nav className="grid grid-flow-col gap-5">
          <Link className="link link-hover" href="/about">About</Link>
          <Link className="link link-hover"
                href="https://www.tum.de/en/about-tum/contact-directions/legal-notice">Legal Notice</Link>
          <p>Copyright © {currentYear}</p>
        </nav>
      </footer>
    </div>
  );
};

export default Home;