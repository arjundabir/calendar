import { defineSchema, defineTable } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { calendarEventValidator } from './calendar';
import { termsTable } from './tables/term';

const schema = defineSchema({
  ...authTables,
  calendarEvents: defineTable(calendarEventValidator),
  terms: termsTable,
});

export default schema;
