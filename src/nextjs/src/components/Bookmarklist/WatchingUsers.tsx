import { User2 } from "lucide-react";
import Image from "next/image";
import { Profile } from "~/mongodb";

export const WatchingUsers = ({ users }: { users: Profile[] }) => {
  console.log(users);

  if (users.length === 0) return null;

  return (
    <div className="overflow flex max-w-full flex-row gap-x-2">
      Users currently editing:{" "}
      {users.map((u) => {
        return (
          <div
            key={u.userid}
            className="tooltip tooltip-top"
            data-tip={u.username}
          >
            {u?.image ? (
              <Image
                alt="user profile image"
                src={u.image}
                width={28}
                height={28}
              />
            ) : (
              <User2 />
            )}
          </div>
        );
      })}
    </div>
  );
};
