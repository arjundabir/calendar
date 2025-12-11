import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Time validator for meetings and final exams
const timeValidator = v.object({
    hour: v.number(),
    minute: v.number(),
});

// Meeting validator - discriminated union for TBA or scheduled
const meetingValidator = v.union(
    v.object({
        timeIsTBA: v.literal(true),
    }),
    v.object({
        timeIsTBA: v.literal(false),
        bldg: v.array(v.string()),
        days: v.string(),
        startTime: timeValidator,
        endTime: timeValidator,
    })
);

// Final exam validator - discriminated union
const finalExamValidator = v.union(
    v.object({
        examStatus: v.literal('NO_FINAL'),
    }),
    v.object({
        examStatus: v.literal('TBA_FINAL'),
    }),
    v.object({
        examStatus: v.literal('SCHEDULED_FINAL'),
        dayOfWeek: v.string(),
        month: v.number(),
        day: v.number(),
        startTime: timeValidator,
        endTime: timeValidator,
        bldg: v.array(v.string()),
    })
);

// CalendarEvents validator - combines Section fields with deptCode, deptName, and courseNumber
export const calendarEventValidator = v.object({
    // Section fields
    units: v.string(),
    status: v.union(
        v.literal('OPEN'),
        v.literal('Waitl'),
        v.literal('FULL'),
        v.literal('NewOnly'),
        v.literal('')
    ),
    meetings: v.array(meetingValidator),
    finalExam: finalExamValidator,
    sectionNum: v.string(),
    instructors: v.array(v.string()),
    maxCapacity: v.string(),
    sectionCode: v.string(),
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
        v.literal('Tut')
    ),
    numRequested: v.string(),
    restrictions: v.string(),
    numOnWaitlist: v.string(),
    numWaitlistCap: v.string(),
    sectionComment: v.string(),
    numNewOnlyReserved: v.string(),
    numCurrentlyEnrolled: v.object({
        totalEnrolled: v.string(),
        sectionEnrolled: v.string(),
    }),
    updatedAt: v.union(v.string(), v.null()),
    webURL: v.string(),
    // Additional fields from Course and DepartmentInSchool
    deptCode: v.string(),
    deptName: v.string(),
    courseNumber: v.string(),
    userId: v.string()
});

export const createCalendarEvent = mutation({
    args: {
        event: calendarEventValidator,
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("calendarEvents", args.event);
        return id;
    }
})

export const getUserEvents = query({
    args: {
        userId: v.string()
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("calendarEvents")
            .filter(q => q.eq(q.field("userId"), args.userId))
            .collect();
        return events;
    }
})

export const deleteCalendarEvent = mutation({
    args: {
        sectionCode: v.string()
    },
    handler: async (ctx, args) => {
        const event = await ctx.db
            .query("calendarEvents")
            .filter(q => q.eq(q.field("sectionCode"), args.sectionCode))
            .first();
        if (event) {
            await ctx.db.delete(event._id);
        }
    },
})