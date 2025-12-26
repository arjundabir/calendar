import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import createClient from 'openapi-fetch';
import path from 'path';
import type { paths } from '@/types/anteater-api-types';

export interface CourseIndex {
	department: string;
	courseNumber: string;
	title: string;
}

async function fetchAllCourses(): Promise<CourseIndex[]> {
	const client = createClient<paths>({ baseUrl: 'https://anteaterapi.com' });
	const courses: CourseIndex[] = [];
	let cursor: string | undefined = undefined;

	while (true) {
		// @ts-expect-error - openapi-fetch has circular type inference issues
		const { data, error } = await client.GET('/v2/rest/coursesCursor', {
			params: { query: cursor ? { cursor } : {} },
		});

		if (error || !data?.ok) {
			throw new Error('Failed to fetch courses');
		}

		for (const course of data.data.items) {
			courses.push({
				department: course.department,
				courseNumber: course.courseNumber,
				title: course.title,
			});
		}

		const nextCursor: string | null = data.data.nextCursor;
		if (!nextCursor) break;
		cursor = nextCursor;
	}

	return courses;
}

export async function GET() {
	try {
		const courses = await fetchAllCourses();

		// Write to /public/course-index.json
		const filePath = path.join(process.cwd(), 'public', 'course-index.json');
		await writeFile(filePath, JSON.stringify(courses, null, 2));

		return NextResponse.json({
			success: true,
			message: `Indexed ${courses.length} courses`,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to index courses',
			},
			{ status: 500 },
		);
	}
}
