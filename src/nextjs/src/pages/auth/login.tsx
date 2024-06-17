import {GetServerSidePropsContext, InferGetServerSidePropsType} from "next";
import {getServerSession} from "next-auth";
import {getProviders, signIn} from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {authOptions} from "~/server/auth";
import Google from "public/google.png";
import Github from "public/github.png";
import Gitlab from "public/gitlab.png";
import Linkedin from "public/linkedin.png";

const images = [
  {
    provider: "google",
    image: Google,
  },
  {
    provider: "github",
    image: Github,
  },
  {
    provider: "linkedin",
    image: Linkedin,
  },
  {
    provider: "gitlab",
    image: Gitlab,
  },
];

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/" } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}

const LoginPage = ({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div className="flex h-full w-full flex-col items-center bg-base-200 p-4">
      <Link
        href="/"
        className="whitespace-nowrap text-3xl text-black md:px-8"
        data-tip="Go to start page"
      >
        <h1 className="text-5xl font-bold text-primary">NLP-KG</h1>
      </Link>
      <div className="hero">
        <div className="hero-content flex flex-col gap-y-4">
          {Object.values(providers).map((provider) => {
            const src = images.find((i) => i.provider === provider.id);

            return (
              <div key={provider.name}>
                <button
                  className="btn flex flex-row gap-x-4"
                  onClick={() => signIn(provider.id)}
                >
                  {src !== undefined && (
                    <Image
                      src={src?.image}
                      alt={provider.name}
                      width={24}
                      height={24}
                      unoptimized
                    />
                  )}
                  Sign in with {provider.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
