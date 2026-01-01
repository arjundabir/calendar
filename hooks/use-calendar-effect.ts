'use client';

import { useCalendarContext } from '@/components/calendar/calendar-provider';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

// TODO (@arjundabir): have a way to update local or user calendar

export function useCalendarEvent(): Doc<'events'>[] | null {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { localStorageEvents } = useCalendarContext();
	const userCalendar = useQuery(api.events.queries.getUserEvents);
	const sharedCalendarEvents = useQuery(
		api.shares.queries.getSharedCalendarEvents,
	);
	if (isLoading) return null;

	if (!isAuthenticated) {
		const convertedLocalEvents: Doc<'events'>[] = [];
		for (const events of localStorageEvents) {
			for (const event of events.events) {
				const convertedLocalEvent: Doc<'events'> = {
					_creationTime: Date.now(),
					_id: events.calendarName as Id<'events'>,
					event: event,
					calendarId: events.calendarName as Id<'calendars'>,
					userId: 'local' as Id<'users'>,
				};
				convertedLocalEvents.push(convertedLocalEvent);
			}
		}

		return convertedLocalEvents;
	}

	return [...(userCalendar ?? []), ...(sharedCalendarEvents ?? [])];
}
