import { forwardRef, useState } from "react";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import {
  CreateBookmarklistInput,
  createBookmarklistInput,
} from "~/schemas/bookmarklist.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { InputField } from "../ui/formfields";
import { BookmarkPlus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "~/utils/api";

const CreateListInput = () => {
  const utils = api.useUtils();
  const { mutate: createList } = api.bookmarklist.create.useMutation({
    onError: () => {
      // TODO show error
    },
    onSettled: () => {
      utils.bookmarklist.invalidate();
    },
  });

  const form = useForm<CreateBookmarklistInput>({
    resolver: zodResolver(createBookmarklistInput),
    defaultValues: {
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          createList(values);
          form.reset({ name: "" });
        })}
        className="flex flex-row items-center gap-x-4 px-2 text-sm"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Create new list"
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        />
        <button className="btn btn-circle btn-ghost btn-sm">
          <BookmarkPlus />
        </button>
      </form>
    </Form>
  );
};

export default CreateListInput;
