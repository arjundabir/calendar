import { v } from 'convex/values';

// Event validator - matches the event object structure
// This excludes userId and calendarId which are at the table level
export const eventValidator = v.object({
	courseNumber: v.string(),
	deptCode: v.string(),
	deptName: v.string(),
	finalExam: v.union(
		v.object({ examStatus: v.literal('NO_FINAL') }),
		v.object({ examStatus: v.literal('TBA_FINAL') }),
		v.object({
			examStatus: v.literal('SCHEDULED_FINAL'),
			dayOfWeek: v.string(),
			month: v.number(),
			day: v.number(),
			startTime: v.object({
				hour: v.number(),
				minute: v.number(),
			}),
			endTime: v.object({
				hour: v.number(),
				minute: v.number(),
			}),
			bldg: v.array(v.string()),
		}),
	),
	instructors: v.array(v.string()),
	maxCapacity: v.string(),
	meetings: v.array(
		v.union(
			v.object({ timeIsTBA: v.literal(true) }),
			v.object({
				timeIsTBA: v.literal(false),
				bldg: v.array(v.string()),
				days: v.string(),
				startTime: v.object({
					hour: v.number(),
					minute: v.number(),
				}),
				endTime: v.object({
					hour: v.number(),
					minute: v.number(),
				}),
			}),
		),
	),
	numCurrentlyEnrolled: v.object({
		totalEnrolled: v.string(),
		sectionEnrolled: v.string(),
	}),
	numOnWaitlist: v.string(),
	numWaitlistCap: v.string(),
	numNewOnlyReserved: v.string(),
	numRequested: v.string(),
	restrictions: v.string(),
	sectionCode: v.string(),
	sectionComment: v.string(),
	sectionType: v.union(
		v.literal('Act'),
		v.literal('Col'),
		v.literal('Dis'),
		v.literal('Fld'),
		v.literal('Lab'),
		v.literal('Lec'),
		v.literal('Qiz'),
		v.literal('Res'),
		v.literal('Sem'),
		v.literal('Stu'),
		v.literal('Tap'),
		v.literal('Tut'),
	),
	sectionNum: v.string(),
	status: v.union(
		v.literal('OPEN'),
		v.literal('Waitl'),
		v.literal('FULL'),
		v.literal('NewOnly'),
		v.literal(''),
	),
	units: v.string(),
	updatedAt: v.union(v.string(), v.null()),
	webURL: v.string(),
});

