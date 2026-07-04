import z from "zod";
import { DrawerEntity, DrawerMode } from "./enums";

export const drawerEntitySchema = z.enum(DrawerEntity);
export const drawerModeSchema = z.enum(DrawerMode);
