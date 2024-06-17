import { type User } from "next-auth";
import { profileModel } from "~/mongodb";
import { v4 as uuid } from "uuid";

export const createProfile = async (newUser: User) => {
  console.log("Creating profile for user", newUser);

  await profileModel().create({
    userid: newUser.id,
    username: newUser.name ?? uuid(),
    image: newUser.image ?? null,
  });
};
