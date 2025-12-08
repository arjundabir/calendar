import { z } from 'zod';

// ============================================================================
// Shared Error Schema
// ============================================================================
export const WebSocErrorSchema = z.object({
  ok: z.literal(false),
  message: z.string(),
});

// ============================================================================
// Terms Endpoint Schemas
// ============================================================================
export const TermSchema = z.object({
  shortName: z.string(),
  longName: z.string(),
});

export const WebSocTermsSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.array(TermSchema),
});

export const WebSocTermsResponseSchema = z.discriminatedUnion('ok', [
  WebSocTermsSuccessSchema,
  WebSocErrorSchema,
]);

// ============================================================================
// Departments Endpoint Schemas
// ============================================================================
export const DepartmentSchema = z.object({
  deptCode: z.string(),
  deptName: z.string(),
});

export const WebSocDepartmentsSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.array(DepartmentSchema),
});

export const WebSocDepartmentsResponseSchema = z.discriminatedUnion('ok', [
  WebSocDepartmentsSuccessSchema,
  WebSocErrorSchema,
]);

// ============================================================================
// Query WebSoc Endpoint Schemas
// ============================================================================
export interface QueryWebSocParams {
  year: string; // Required
  quarter: 'Fall' | 'Winter' | 'Spring' | 'Summer1' | 'Summer10wk' | 'Summer2'; // Required
  ge?: string; // enum: ANY, GE-1A, GE-1B, GE-2, GE-3, etc.
  department?: string;
  courseTitle?: string;
  courseNumber?: string;
  sectionCodes?: string; // Comma-separated list of section codes or ranges
  instructorName?: string; // Case-insensitive
  days?: string;
  building?: string;
  room?: string;
  division?: 'LowerDiv' | 'UpperDiv' | 'Graduate';
  sectionType?:
    | 'ANY'
    | 'Act'
    | 'Col'
    | 'Dis'
    | 'Fld'
    | 'Lab'
    | 'Lec'
    | 'Qiz'
    | 'Res'
    | 'Sem'
    | 'Stu'
    | 'Tap'
    | 'Tut';
  fullCourses?:
    | 'ANY'
    | 'SkipFull'
    | 'SkipFullWaitlist'
    | 'FullOnly'
    | 'Overenrolled';
  cancelledCourses?: 'Exclude' | 'Include' | 'Only';
  units?: 'VAR';
  startTime?: string; // Pattern: ^(\d{1,2}):(\d{2})([ap]m?)?$
  endTime?: string; // Pattern: ^(\d{1,2}):(\d{2})([ap]m?)?$
  excludeRestrictionCodes?: string;
  includeRelatedCourses?: string | null;
}

// Time object schema for meetings and final exams
const TimeSchema = z.object({
  hour: z.number(),
  minute: z.number(),
});

// Meeting schema - can be TBA or scheduled
const MeetingSchema = z.discriminatedUnion('timeIsTBA', [
  z.object({
    timeIsTBA: z.literal(true),
  }),
  z.object({
    timeIsTBA: z.literal(false),
    bldg: z.array(z.string()),
    days: z.string(),
    startTime: TimeSchema,
    endTime: TimeSchema,
  }),
]);

// Final exam schema - can be NO_FINAL, TBA_FINAL, or SCHEDULED_FINAL
const FinalExamSchema = z.discriminatedUnion('examStatus', [
  z.object({
    examStatus: z.literal('NO_FINAL'),
  }),
  z.object({
    examStatus: z.literal('TBA_FINAL'),
  }),
  z.object({
    examStatus: z.literal('SCHEDULED_FINAL'),
    dayOfWeek: z.string(),
    month: z.number(),
    day: z.number(),
    startTime: TimeSchema,
    endTime: TimeSchema,
    bldg: z.array(z.string()),
  }),
]);

// Status enum for sections
const SectionStatusSchema = z.union([
  z.enum(['OPEN', 'Waitl', 'FULL', 'NewOnly']),
  z.literal(''),
]);

// Section type enum
const SectionTypeEnumSchema = z.enum([
  'Act',
  'Col',
  'Dis',
  'Fld',
  'Lab',
  'Lec',
  'Qiz',
  'Res',
  'Sem',
  'Stu',
  'Tap',
  'Tut',
]);

export const SectionSchema = z.object({
  units: z.string(),
  status: SectionStatusSchema,
  meetings: z.array(MeetingSchema),
  finalExam: FinalExamSchema,
  sectionNum: z.string(),
  instructors: z.array(z.string()),
  maxCapacity: z.string(),
  sectionCode: z.string(),
  sectionType: SectionTypeEnumSchema,
  numRequested: z.string(),
  restrictions: z.string(),
  numOnWaitlist: z.string(),
  numWaitlistCap: z.string(),
  sectionComment: z.string(),
  numNewOnlyReserved: z.string(),
  numCurrentlyEnrolled: z.object({
    totalEnrolled: z.string(),
    sectionEnrolled: z.string(),
  }),
  updatedAt: z.nullable(z.string()),
  webURL: z.string(),
});

export const CourseSchema = z.object({
  sections: z.array(SectionSchema),
  deptCode: z.string(),
  courseTitle: z.string(),
  courseNumber: z.string(),
  courseComment: z.string(),
  prerequisiteLink: z.string(),
  updatedAt: z.nullable(z.string()),
});

export const DepartmentInSchoolSchema = z.object({
  courses: z.array(CourseSchema),
  deptCode: z.string(),
  deptName: z.string(),
  deptComment: z.string(),
  sectionCodeRangeComments: z.array(z.string()),
  courseNumberRangeComments: z.array(z.string()),
  updatedAt: z.nullable(z.string()),
});

export const SchoolSchema = z.object({
  departments: z.array(DepartmentInSchoolSchema),
  schoolName: z.string(),
  schoolComment: z.string(),
  updatedAt: z.nullable(z.string()),
});

export const WebSocQuerySuccessSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    schools: z.array(SchoolSchema),
  }),
});

export const WebSocQueryResponseSchema = z.discriminatedUnion('ok', [
  WebSocQuerySuccessSchema,
  WebSocErrorSchema,
]);

// ============================================================================
// Type Exports
// ============================================================================
export type Term = z.infer<typeof TermSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type DepartmentInSchool = z.infer<typeof DepartmentInSchoolSchema>;
export type School = z.infer<typeof SchoolSchema>;

export type WebSocError = z.infer<typeof WebSocErrorSchema>;
export type WebSocTermsSuccess = z.infer<typeof WebSocTermsSuccessSchema>;
export type WebSocTermsResponse = z.infer<typeof WebSocTermsResponseSchema>;
export type WebSocDepartmentsSuccess = z.infer<
  typeof WebSocDepartmentsSuccessSchema
>;
export type WebSocDepartmentsResponse = z.infer<
  typeof WebSocDepartmentsResponseSchema
>;
export type WebSocQuerySuccess = z.infer<typeof WebSocQuerySuccessSchema>;
export type WebSocQueryResponse = z.infer<typeof WebSocQueryResponseSchema>;
