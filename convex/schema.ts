import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { calendarEventValidator } from "./calendar";
 
const schema = defineSchema({
  ...authTables,
  calendarEvents: defineTable(calendarEventValidator),
});
 
export default schema;