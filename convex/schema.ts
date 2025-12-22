import { defineSchema } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { usersTable } from './tables/user';
import { sharesTable } from './tables/shares';
import { eventsTable } from './tables/events';
import { calendarsTable } from './tables/calendars';

const schema = defineSchema({
	...authTables,
	users: usersTable,
	shares: sharesTable,
	events: eventsTable,
	calendars: calendarsTable,
});

export default schema;
