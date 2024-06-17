import {type AppProps} from "next/app";
import {api} from "~/utils/api";
import "~/styles/globals.css";
import {Layout} from "~/components/Layout";
import {SearchContextProvider} from "~/context/SearchContext";
import {ToggleContextProvider} from "~/context/ToggleContext";
import {SessionProvider} from "next-auth/react";
import {type NextPage} from "next";
import {type Session} from "next-auth";
import {ConfirmationServiceProvider} from "~/context/ConfirmationDialogContext";
import GoogleAnalytics from "~/components/GoogleAnalytics";

type NextAppProps<P = object, IP = P> = AppProps<{
  session: Session | null;
}> & { Component: NextPage<P, IP> };

const MyApp = ({
  Component,
  pageProps: { session, ...pageProps },
}: NextAppProps) => {
  return (
    <SessionProvider session={session}>
      <ConfirmationServiceProvider>
        <SearchContextProvider>
          <ToggleContextProvider>
            <Layout>
              <GoogleAnalytics/>
              <Component {...pageProps} />
            </Layout>
          </ToggleContextProvider>
        </SearchContextProvider>
      </ConfirmationServiceProvider>
    </SessionProvider>
  );
};
export default api.withTRPC(MyApp);