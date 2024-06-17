import {User2} from "lucide-react";
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next/router";
import {api} from "~/utils/api";

const ProfileButton = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profile } = api.profile.get.useQuery(undefined, {
    enabled: session !== undefined && session !== null,
  });

  if (session === undefined) return <div className="skeleton h-6 w-12" />;

  if (session === null)
    return (
        <button className="btn btn-sm tooltip tooltip-bottom" onClick={() => router.push("/auth/login")}
                data-tip="Log in">
        Log in
      </button>
    );

  return (
    <div className="flex flex-row items-center gap-x-4">
      <button
        className="btn btn-sm tooltip tooltip-bottom"
        onClick={() => router.push(`/profile`)}
        data-tip="Go to your profile"
      >
        <div className="flex flex-row items-center gap-x-2">
          {profile?.image ? (
              <img
              alt="user profile image"
              src={profile.image}
              width={24}
              height={24}
            />
          ) : (
            <User2 />
          )}
          <span>{profile?.username}</span>
        </div>
      </button>
      <button
          className="btn btn-sm tooltip tooltip-bottom"
        onClick={() => signOut()}
        data-tip="Log out"
      >
        Log out
      </button>
    </div>
  );
};

export default ProfileButton;
