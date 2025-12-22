import { defineSchema, defineTable } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { calendarEventValidator } from './calendar';
import { usersTable } from './tables/user';
import { sharesTable } from './tables/shares';
import { eventsTable } from './tables/events';
import { calendarsTable } from './tables/calendars';

const schema = defineSchema({
	...authTables,
	calendarEvents: defineTable(calendarEventValidator),
	users: usersTable,
	shares: sharesTable,
	events: eventsTable,
	calendars: calendarsTable,
});

export default schema;
