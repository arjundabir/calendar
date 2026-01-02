import type { TailwindColors } from '@/components/calendar/calendar-event';
import type { NormalizedEvent } from './calendar-normalizer';
import type { Doc } from '@/convex/_generated/dataModel';

export type RenderEvent = NormalizedEvent & {
	color?: TailwindColors;
	overlapCount?: number;
	overlapIndex?: number;
};
type Meeting = Extract<
	Doc<'events'>['event']['meetings'][number],
	{ timeIsTBA: false }
>;

export function renderEvents(normalizedEvents: NormalizedEvent[]) {
	const classEvents = normalizedEvents.filter((e) => e.type === 'class');
	const finalEvents = normalizedEvents.filter((e) => e.type === 'final');

	return [
		...renderNormalizedEvents(classEvents),
		...renderNormalizedEvents(finalEvents),
	];
}

function renderNormalizedEvents(
	normalizedEvents: NormalizedEvent[],
): RenderEvent[] {
	const renderEventsMap = new Map<string, RenderEvent>();
	const coloredEvents = Map.groupBy(
		normalizedEvents as RenderEvent[],
		(e) => e.sectionCode,
	);
	for (const [sectionCode, events] of coloredEvents) {
		const color = getColor(sectionCode);
		events.forEach((event) => {
			const colorOverride = event.ownerId
				? getColor(event.userId.slice(5))
				: undefined;
			renderEventsMap.set(`${event._id}-${event.dayOfWeek}`, {
				color: colorOverride ?? color,
				overlapCount: 1,
				overlapIndex: 0,
				...event,
			});
		});
	}

	const eventsByDay = Map.groupBy(normalizedEvents, (e) => e.dayOfWeek);
	for (const [_, events] of eventsByDay) {
		const points: {
			id: string;
			time: number;
			type: 'start' | 'end';
		}[] = events.flatMap((e) => [
			{
				id: `${e._id}-${e.dayOfWeek}`,
				time: toMinutes(e.startTime),
				type: 'start',
			},
			{
				id: `${e._id}-${e.dayOfWeek}`,
				time: toMinutes(e.endTime),
				type: 'end',
			},
		]);
		points.sort((a, b) =>
			a.time !== b.time ? a.time - b.time : a.type === 'start' ? -1 : 1,
		);
		const active = new Map<string, number>(); // id -> lane
		let freeLanes: number[] = [];
		let nextLane = 0;

		let clusterMax = 0;
		let clusterMembers = new Set<string>(); // only events in this cluster

		let prevTime: number | null = null;

		for (const point of points) {
			if (prevTime !== null && point.time > prevTime && active.size > 0) {
				clusterMax = Math.max(clusterMax, active.size);
			}

			if (point.type === 'start') {
				const lane = freeLanes.pop() ?? nextLane++;
				active.set(point.id, lane);
				clusterMembers.add(point.id);

				clusterMax = Math.max(clusterMax, active.size);
			} else {
				const lane = active.get(point.id);
				if (lane !== undefined) {
					freeLanes.push(lane);
					active.delete(point.id);
				}

				if (active.size === 0 && clusterMembers.size > 0) {
					for (const id of clusterMembers) {
						const e = renderEventsMap.get(id);
						if (!e) throw Error('not found in rendered events');

						e.overlapIndex = e.overlapIndex ?? 0; // set at start below
						e.overlapCount = clusterMax;
					}

					clusterMembers = new Set();
					clusterMax = 0;
					freeLanes = [];
					nextLane = 0;
				}
			}

			if (point.type === 'start') {
				const e = renderEventsMap.get(point.id);
				if (!e) throw Error('not found in rendered events');
				e.overlapIndex = active.get(point.id)!; // 0-based lane
			}

			prevTime = point.time;
		}
	}
	const renderedEvents = Array.from(renderEventsMap.values()).flat();
	return renderedEvents;
}

function getColor(id: string): TailwindColors {
	const colors: TailwindColors[] = [
		'amber',
		'blue',
		'cyan',
		'emerald',
		'fuchsia',
		'gray',
		'green',
		'indigo',
		'lime',
		'neutral',
		'orange',
		'pink',
		'purple',
		'red',
		'rose',
		'sky',
		'slate',
		'stone',
		'teal',
		'violet',
		'yellow',
		'zinc',
	];
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
}

function toMinutes(time: Meeting['startTime'] | Meeting['endTime']) {
	return time.hour * 60 + time.minute;
}
