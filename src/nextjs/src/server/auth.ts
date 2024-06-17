import {DefaultSession, DefaultUser, getServerSession, NextAuthOptions} from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import GoogleProvider from "next-auth/providers/google";
import LinkedinProvider from "next-auth/providers/linkedin";
import {env} from "~/env.cjs";
import {createProfile} from "./services/auth.service";
import {client, profileModel} from "~/mongodb";
import {GetServerSidePropsContext} from "next";
import {MongoDBAdapter} from "@next-auth/mongodb-adapter";
import {Provider} from "next-auth/providers";
//import profileIcon from "../../public/team/profile-icon.png";
const profileIcon = "../../public/team/profile-icon.png";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string; // Added user id for easier use in frontend
    } & DefaultUser;
  }

  interface User extends DefaultUser {
    id: string;
  }
}

const getProviders = () => {
  const providers: Provider[] = [];

  if (env.GITHUB_ID !== undefined && env.GITHUB_SECRET !== undefined)
    providers.push(
      GithubProvider({
        clientId: env.GITHUB_ID,
        clientSecret: env.GITHUB_SECRET,
      })
    );

  if (env.GOOGLE_ID !== undefined && env.GOOGLE_SECRET !== undefined)
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_ID,
        clientSecret: env.GOOGLE_SECRET,
      })
    );

  if (env.LINKEDIN_ID !== undefined && env.LINKEDIN_SECRET !== undefined)
    providers.push(
        LinkedinProvider({
            clientId: env.LINKEDIN_ID,
            clientSecret: env.LINKEDIN_SECRET,
            authorization: {
                params: {scope: 'openid profile email'},
            },
            issuer: 'https://www.linkedin.com',
            jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
            profile(profile, tokens) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture ?? profileIcon,
                };
            },
        })
    );

  if (env.GITLAB_ID !== undefined && env.GITLAB_SECRET !== undefined)
    providers.push(
      GitlabProvider({
        clientId: env.GITLAB_ID,
        clientSecret: env.GITLAB_SECRET,
        authorization: {
            params: {scope: "read_user"},
          url:
            env.GITLAB_SERVER !== undefined && env.GITLAB_SERVER !== ""
              ? env.GITLAB_SERVER
              : undefined,
        },
      })
    );
  return providers;
};

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  events: {
    createUser: ({ user }) => createProfile(user),
  },
  callbacks: {
    session: async ({ session, user }) => {
      const profile = await profileModel().findOne({ userid: user.id });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          profile,
        },
      };
    },
  },
  adapter: MongoDBAdapter(client),
  secret: env.NEXTAUTH_SECRET,
  providers: getProviders(),
  pages: {
    signIn: "/auth/login",
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};