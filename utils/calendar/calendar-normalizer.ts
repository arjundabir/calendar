import type { Doc } from '@/convex/_generated/dataModel';

type Day = 'M' | 'Tu' | 'W' | 'Th' | 'F';
export type NormalizedEvent = Omit<Doc<'events'>, 'event'> &
	Omit<Doc<'events'>['event'], 'meetings'> &
	Omit<
		Extract<Doc<'events'>['event']['meetings'][number], { timeIsTBA: false }>,
		'days'
	> & {
		dayOfWeek: Day;
		ownerId?: string;
	};

export function normalizeEvents(events: Doc<'events'>[]) {
	const normalizedEvents: NormalizedEvent[] = [];
	for (const event of events) {
		for (const meeting of event.event.meetings) {
			if (!meeting.timeIsTBA) {
				const { event: unstructuredEvent, ...restOfEvent } = event;
				const { meetings: _, ...restOfUnstructuredEvent } = unstructuredEvent;
				const { days, ...restOfMeeting } = meeting;

				const daysOfWeek = splitDays(meeting.days);
				for (const day of daysOfWeek) {
					normalizedEvents.push({
						dayOfWeek: day,
						...restOfEvent,
						...restOfUnstructuredEvent,
						...restOfMeeting,
					});
				}
			} else {
				// TODO: manage when the time is TBA
			}
		}
	}
	return normalizedEvents;
}

function splitDays(dayString: string): Day[] {
	return dayString.match(/M|Tu|W|Th|F|Sa|Su/g) as Day[];
}
