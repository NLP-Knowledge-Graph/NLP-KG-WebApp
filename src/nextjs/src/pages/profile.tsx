import { api } from "~/utils/api";
import { type GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";
import { useForm } from "react-hook-form";
import {
  UpdateProfileInput,
  updateProfileInput,
} from "~/schemas/profile.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "~/components/ui/form";
import { InputField } from "~/components/ui/formfields";
import { useEffect } from "react";
import { Save, Trash } from "lucide-react";
import { useConfirmation } from "~/context/ConfirmationDialogContext";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";

export const getServerSideProps = (async (context) => {
  const session = await getServerAuthSession(context);

  // If user is not logged in return to homepage
  if (session === null)
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };

  return {
    props: {},
  };
}) satisfies GetServerSideProps;

const UserPage = () => {
  const router = useRouter();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { data } = api.profile.get.useQuery();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileInput),
    defaultValues: data,
  });

  useEffect(() => {
    form.reset(data);
  }, [data]);

  const { mutate: updateProfile } = api.profile.update.useMutation({
    onSuccess: (data) => {
      form.reset(data);
    },
    onError: ({ message }) => {
      console.error(message);
    },
    onSettled: () => {
      utils.profile.invalidate();
    },
  });

  const { mutate: deleteAccount } = api.profile.delete.useMutation({
    onSuccess: async (data) => {
      await signOut();
      router.replace("/");
    },
    onError: ({ message }) => {
      console.error(message);
    },
  });

  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">User settings</h2>
            <Form {...form}>
              <form
                className="flex flex-col gap-y-4"
                onSubmit={form.handleSubmit((input) => updateProfile(input))}
              >
                <InputField
                  control={form.control}
                  name="username"
                  label="Username"
                />
                <InputField
                  control={form.control}
                  name="image"
                  label="Profile Image"
                  className="flex-1"
                />
                <InputField
                  control={form.control}
                  name="openaikey"
                  label="OpenAI Key"
                />
                <button
                  type="submit"
                  className="btn btn-secondary btn-outline"
                  disabled={!form.formState.isDirty}
                >
                  <Save />
                </button>
                <button
                  type="button"
                  className="btn btn-error flex flex-row gap-x-2"
                  onClick={() =>
                    confirm({
                      title: "Delete Account",
                      description:
                        "This will also delete all bookmark lists that you have created. Are you sure you want to delete your account?",
                      submit: "Delete",
                      cancel: "Cancel",
                    }).then(() => deleteAccount())
                  }
                >
                  <Trash />
                  Delete Account
                </button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
