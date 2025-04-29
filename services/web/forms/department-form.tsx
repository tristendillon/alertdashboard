"use client";
import { States } from "@workspace/convex/lib/constants";
import { useForm } from "@workspace/ui/hooks/use-form";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select";
import z from "zod";
import { useUser } from "@workspace/ui/providers/user-provider";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@workspace/convex/app/_generated/api";

const departmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, { message: "Name must be less than 30 characters" }),
  image: z.string(),
  city: z
    .string()
    .min(1, "City is required")
    .max(30, { message: "City must be less than 50 characters" }),
  state: z.nativeEnum(States),
});

export default function DepartmentForm() {
  const user = useUser();
  const { data, isPending, isError, error, mutateAsync } = useMutation({
    mutationFn: useConvexMutation(
      api.organizationSchema.departments.createDepartment
    ),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      city: "",
      state: States.Alabama,
      image: "",
    },
    validators: {
      onSubmit: departmentFormSchema,
    },
    onSubmit: async ({ value }) => {
      const create = {
        ...value,
        organization: user!.organization,
      };
      try {
        const res = await mutateAsync(create);
      } catch (error) {}
    },
  });

  if (isPending) {
    return <div>loading type shi...</div>;
  }

  if (isError) {
    return <div>error type shi...</div>;
  }

  return (
    <form className="space-y-4">
      <form.AppField
        name="name"
        children={(field) => (
          <div className="space-y-2">
            <form.Label>Name</form.Label>
            <field.Input
              placeholder="Department Name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <form.FieldInfo field={field} />
          </div>
        )}
      />

      <form.AppField
        name="city"
        children={(field) => (
          <div className="space-y-2">
            <form.Label>City</form.Label>
            <field.Input
              placeholder="City"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <form.FieldInfo field={field} />
          </div>
        )}
      />

      <form.AppField
        name="state"
        children={(field) => (
          <div className="space-y-2">
            <form.Label>State</form.Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as States)}
              onOpenChange={() => field.handleBlur()}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.values(States).map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <form.FieldInfo field={field} />
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <form.Button
            type="submit"
            className="w-full"
            onClick={() => form.handleSubmit()}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </form.Button>
        )}
      />
    </form>
  );
}
