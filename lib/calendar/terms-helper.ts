import { format, isAfter, parseISO } from 'date-fns';
import { paths } from '@/types/anteater-api-types';

type Calendars =
	paths['/v2/rest/calendar/all']['get']['responses'][200]['content']['application/json']['data'];

export function getLatestSocAvailable(calendars: Calendars) {
	// Get current date in Los Angeles timezone
	const laDate = new Date(
		new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
	);
	const today = parseISO(format(laDate, 'yyyy-MM-dd'));

	// Filter to only socAvailable dates that are <= today, then get the most recent one
	const validCalendars = calendars.filter(
		(calendar) => !isAfter(parseISO(calendar.socAvailable), today),
	);

	// Sort descending by socAvailable and return the first (most recent)
	return validCalendars.sort(
		(a, b) =>
			parseISO(b.socAvailable).getTime() - parseISO(a.socAvailable).getTime(),
	)[0];
}
