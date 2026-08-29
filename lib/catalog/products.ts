import type { Catalog } from "../domain/product";
import { BEDROOM } from "./bedroom";
import { SEATING } from "./seating";
import { SOFT } from "./soft";
import { STORAGE } from "./storage";
import { TABLES } from "./tables";

export const CATALOG: Catalog = [...SEATING, ...TABLES, ...STORAGE, ...BEDROOM, ...SOFT];
