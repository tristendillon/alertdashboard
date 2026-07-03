import { useQueryState } from "nuqs";

import type { UseQueryStateOptions } from "nuqs";
import type { Modals } from "@/lib/enums";
import { modalSchema } from "@/lib/schemas";

const modalQueryStateOpts: UseQueryStateOptions<Modals> = {
  clearOnDefault: true,
  parse: (value) => {
    return modalSchema.parse(value);
  },
  serialize: (value) => {
    return modalSchema.parse(value);
  },
};
export const useModalState = () => {
  const nqs = useQueryState("modal", modalQueryStateOpts);
  return nqs;
};
