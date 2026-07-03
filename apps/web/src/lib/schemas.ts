import z from "zod";
import { Modals } from "./enums";

export const modalSchema = z.enum(Modals);
