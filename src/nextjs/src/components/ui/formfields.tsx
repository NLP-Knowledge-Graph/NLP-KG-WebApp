import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input, InputProps } from "./input";
import { Optional } from "~/utils/types";

export type FieldProps = {
  label?: string;
  description?: string;
};

export type InputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> = Optional<ControllerProps<TFieldValues, TName>, "render"> &
  InputProps &
  FieldProps;

export const InputField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  onChange,
  ...props
}: InputFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Input
                {...field}
                {...props}
                onChange={(e) => {
                  field.onChange(e);

                  if (onChange) onChange(e);
                }}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
