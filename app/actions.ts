import { paths } from '@/types/anteater-api-types';
import createClient from 'openapi-fetch';

const client = createClient<paths>({ baseUrl: 'https://anteaterapi.com' });

async function getWebSocTerms() {
  const { data, error } = await client.GET('/v2/rest/websoc/terms');
  // In anteater-api-types, error object has ok: false if there was an error.
  if (error) return [];

  return data.data;
}

type QueryWebSocParams = paths['/v2/rest/websoc']['get']['parameters']['query'];

async function queryWebSoc(params: QueryWebSocParams) {
  const { data, error } = await client.GET('/v2/rest/websoc', {
    cache: 'force-cache',
    next: { revalidate: 60 * 60 },
    params: {
      query: {
        year: params.year,
        quarter: params.quarter,
        ...(params.ge ? { ge: params.ge } : {}),
        ...(params.department ? { department: params.department } : {}),
        ...(params.courseTitle ? { courseTitle: params.courseTitle } : {}),
        ...(params.courseNumber ? { courseNumber: params.courseNumber } : {}),
        ...(params.sectionCodes ? { sectionCodes: params.sectionCodes } : {}),
        ...(params.instructorName
          ? { instructorName: params.instructorName }
          : {}),
        ...(params.days ? { days: params.days } : {}),
        ...(params.building ? { building: params.building } : {}),
        ...(params.room ? { room: params.room } : {}),
        ...(params.division ? { division: params.division } : {}),
        ...(params.sectionType ? { sectionType: params.sectionType } : {}),
        ...(params.fullCourses ? { fullCourses: params.fullCourses } : {}),
        ...(params.cancelledCourses
          ? { cancelledCourses: params.cancelledCourses }
          : {}),
        ...(params.units ? { units: params.units } : {}),
        ...(params.startTime ? { startTime: params.startTime } : {}),
        ...(params.endTime ? { endTime: params.endTime } : {}),
        ...(params.excludeRestrictionCodes
          ? { excludeRestrictionCodes: params.excludeRestrictionCodes }
          : {}),
        ...(params.includeRelatedCourses
          ? { includeRelatedCourses: params.includeRelatedCourses }
          : {}),
      },
    },
  });
  if (error) return [];
  return data.data;
}

async function listAllCalendars() {
  const { data, error } = await client.GET('/v2/rest/calendar/all', {
    cache: 'force-cache',
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (error) return [];
  return data.data;
}

async function retrieveCurrentWeek() {
  const { data, error } = await client.GET('/v2/rest/week', {
    params: { query: { year: '2026', month: 1, day: 5 } },
    // cache: 'force-cache',
    // next: { revalidate: 60 * 60 },
  });

  if (error) return [];

  return data.data;
}

export { getWebSocTerms, queryWebSoc, retrieveCurrentWeek, listAllCalendars };
