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
		type: 'class' | 'final';
	};

export function normalizeEvents(events: Doc<'events'>[]) {
	const normalizedEvents: NormalizedEvent[] = [];
	for (const event of events) {
		if (event.event.finalExam.examStatus === 'SCHEDULED_FINAL') {
			const { event: unstructuredEvent, ...restOfEvent } = event;
			const { meetings: _, ...restOfUnstructuredEvent } = unstructuredEvent;
			const finalExam = event.event.finalExam;
			const day = convertDayFormat(finalExam.dayOfWeek);
			normalizedEvents.push({
				type: 'final',
				...restOfEvent,
				...restOfUnstructuredEvent,
				...finalExam,
				startTime: finalExam.startTime,
				endTime: finalExam.endTime,
				dayOfWeek: day,
				timeIsTBA: false,
			});
		}

		for (const meeting of event.event.meetings) {
			if (!meeting.timeIsTBA) {
				const { event: unstructuredEvent, ...restOfEvent } = event;
				const { meetings: _, ...restOfUnstructuredEvent } = unstructuredEvent;
				const { days, ...restOfMeeting } = meeting;

				const daysOfWeek = splitDays(meeting.days);
				for (const day of daysOfWeek) {
					normalizedEvents.push({
						dayOfWeek: day,
						type: 'class',
						...restOfEvent,
						...restOfUnstructuredEvent,
						...restOfMeeting,
					});
				}
			}
		}
	}
	return normalizedEvents;
}

function splitDays(dayString: string): Day[] {
	return dayString.match(/M|Tu|W|Th|F/g) as Day[];
}

function convertDayFormat(dayString: string): Day {
	switch (dayString) {
		case 'Mon':
			return 'M';
		case 'Tue':
			return 'Tu';
		case 'Wed':
			return 'W';
		case 'Thu':
			return 'Th';
		case 'Fri':
			return 'F';
		default:
			throw Error(`${dayString} is not valid`);
	}
}
