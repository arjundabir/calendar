import fs from 'node:fs';
import { NextResponse } from 'next/server';

export async function GET() {
	const coursesFileData = await fs.promises.readFile(
		`${process.cwd()}/public/course-index.json`,
		'utf8',
	);
	const coursesIndex = JSON.parse(coursesFileData);
	return NextResponse.json(coursesIndex);
}
