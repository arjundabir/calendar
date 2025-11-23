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
// Note: Using z.any() for truncated fields marked as "[Max Depth Exceeded]"
// You can expand these schemas later with actual structures if needed
export const SectionSchema = z
  .object({
    units: z.string(),
    status: z.any(), // "[Max Depth Exceeded]" - expand later
    meetings: z.array(z.any()), // "[Max Depth Exceeded]" - expand later
    finalExam: z.any(), // "[Max Depth Exceeded]" - expand later
    sectionNum: z.string(),
    instructors: z.array(z.any()), // "[Max Depth Exceeded]" - expand later
    maxCapacity: z.string(),
    sectionCode: z.string(),
    sectionType: z.string(),
    numRequested: z.string(),
  })
  .passthrough(); // Allow additional properties

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
