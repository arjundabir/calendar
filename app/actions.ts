import {
  WebSocTermsResponseSchema,
  WebSocQueryResponseSchema,
  QueryWebSocParams,
} from '@/types/websoc';

const ANTEATER_API_URL = new URL('https://anteaterapi.com/v2/rest');
const ANTEATER_WEBSOC_URL = ANTEATER_API_URL + "/websoc"
const ANTEATER_TERMS_URL = ANTEATER_WEBSOC_URL + "/terms"

async function getWebSocTerms() {
  const response = await fetch(ANTEATER_TERMS_URL);
  const result = await response.json();
  const parsed = WebSocTermsResponseSchema.parse(result);

  if (parsed.ok) return parsed.data;
  throw new Error(ANTEATER_TERMS_URL.toString());
}

async function queryWebSoc(params: QueryWebSocParams) {
  const url = new URL(ANTEATER_WEBSOC_URL);

  // Add required parameters
  url.searchParams.append('year', params.year);
  url.searchParams.append('quarter', params.quarter);

  // Add optional parameters
  if (params.ge) url.searchParams.append('ge', params.ge);
  if (params.department) url.searchParams.append('department', params.department);
  if (params.courseTitle) url.searchParams.append('courseTitle', params.courseTitle);
  if (params.courseNumber)
    url.searchParams.append('courseNumber', params.courseNumber);
  if (params.sectionCodes)
    url.searchParams.append('sectionCodes', params.sectionCodes);
  if (params.instructorName)
    url.searchParams.append('instructorName', params.instructorName);
  if (params.days) url.searchParams.append('days', params.days);
  if (params.building) url.searchParams.append('building', params.building);
  if (params.room) url.searchParams.append('room', params.room);
  if (params.division) url.searchParams.append('division', params.division);
  if (params.sectionType)
    url.searchParams.append('sectionType', params.sectionType);
  if (params.fullCourses)
    url.searchParams.append('fullCourses', params.fullCourses);
  if (params.cancelledCourses)
    url.searchParams.append('cancelledCourses', params.cancelledCourses);
  if (params.units) url.searchParams.append('units', params.units);
  if (params.startTime) url.searchParams.append('startTime', params.startTime);
  if (params.endTime) url.searchParams.append('endTime', params.endTime);
  if (params.excludeRestrictionCodes)
    url.searchParams.append(
      'excludeRestrictionCodes',
      params.excludeRestrictionCodes
    );
  if (params.includeRelatedCourses !== undefined) {
    if (params.includeRelatedCourses !== null) {
      url.searchParams.append(
        'includeRelatedCourses',
        params.includeRelatedCourses
      );
    } else {
      url.searchParams.append('includeRelatedCourses', '');
    }
  }

  const response = await fetch(url.toString());
  const result = await response.json();
  const parsed = WebSocQueryResponseSchema.parse(result);

  if (parsed.ok) return parsed.data;
  else throw new Error(parsed.message);
}

export { getWebSocTerms, queryWebSoc };
