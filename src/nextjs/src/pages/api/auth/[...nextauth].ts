import NextAuth from "next-auth";
import { authOptions } from "~/server/auth";

// Next-auth is handling everything related to authentication
export default NextAuth(authOptions);
