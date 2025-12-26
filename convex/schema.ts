import { authTables } from '@convex-dev/auth/server';
import { defineSchema } from 'convex/server';
import { calendarsTable } from './tables/calendars';
import { eventsTable } from './tables/events';
import { sharesTable } from './tables/shares';
import { usersTable } from './tables/user';

const schema = defineSchema({
	...authTables,
	users: usersTable,
	shares: sharesTable,
	events: eventsTable,
	calendars: calendarsTable,
});

export default schema;
