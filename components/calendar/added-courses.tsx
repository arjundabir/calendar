'use client';

import { Fragment, useMemo } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../table';
import { MinusIcon } from '@heroicons/react/24/solid';
import { Heading, Subheading } from '../heading';
import { Strong, Text, TextLink } from '../text';
import { format } from 'date-fns';
import { useCalendarContext } from './calendar-provider';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useTabContext } from './tab-context';
import { Button } from '../button';
import { CalendarEvents } from './calendar-provider';

// Group calendar events by department and course
function groupEventsByCourse(events: CalendarEvents[]) {
	const grouped: Record<string, Record<string, CalendarEvents[]>> = {};

	events.forEach((event) => {
		const deptKey = `${event.deptCode}-${event.deptName}`;
		const courseKey = `${event.deptCode} ${event.courseNumber}`;

		if (!grouped[deptKey]) {
			grouped[deptKey] = {};
		}
		if (!grouped[deptKey][courseKey]) {
			grouped[deptKey][courseKey] = [];
		}
		grouped[deptKey][courseKey].push(event);
	});

	return grouped;
}

export function AddedCourses() {
	const { tabs } = useTabContext();
	const { isSignedIn } = useUser();
	const { calendarEvents, removeCalendarEvent } = useCalendarContext();

	const getCalendarEvents = useQuery(api.calendar.getUserEvents);
	const deleteCalendarEvent = useMutation(api.calendar.deleteCalendarEvent);

	// Combine local and database events
	const allEvents = useMemo(() => {
		const localEvents = calendarEvents || [];
		const dbEvents = getCalendarEvents || [];

		// For authenticated users, use database events
		// For unauthenticated users, use local events
		if (isSignedIn) {
			return dbEvents as CalendarEvents[];
		}
		return localEvents;
	}, [calendarEvents, getCalendarEvents, isSignedIn]);

	const groupedEvents = useMemo(
		() => groupEventsByCourse(allEvents),
		[allEvents],
	);

	const handleRemove = (sectionCode: string) => {
		if (isSignedIn) {
			deleteCalendarEvent({ sectionCode });
		} else {
			removeCalendarEvent(sectionCode);
		}
	};

	return (
		tabs[1].current && (
			<div className="flex-1 overflow-y-auto p-4">
				{allEvents.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<Text>
							No courses added yet. Search and add courses to see them here.
						</Text>
					</div>
				) : (
					<div>
						{Object.entries(groupedEvents).map(([deptKey, courses]) => {
							const [, deptName] = deptKey.split('-');
							return (
								<Fragment key={deptKey}>
									<div className="flex w-full items-center justify-between gap-x-4 py-3 text-left text-base/6 font-semibold text-zinc-950 sm:py-2.5 sm:text-sm/6 dark:text-white">
										<Heading level={4}>{deptName}</Heading>
									</div>
									{Object.entries(courses).map(([courseKey, sections]) => {
										const firstSection = sections[0];
										return (
											<Fragment key={courseKey}>
												<div className="flex justify-between">
													<div>
														<Subheading>
															{firstSection.deptCode}{' '}
															{firstSection.courseNumber}
														</Subheading>
													</div>
												</div>
												<Table striped dense>
													<TableHead>
														<TableRow>
															<TableHeader className="px-0!" />
															<TableHeader>Code</TableHeader>
															<TableHeader>Type</TableHeader>
															<TableHeader>Instructors</TableHeader>
															<TableHeader>Times</TableHeader>
															<TableHeader>Enrollment</TableHeader>
															<TableHeader>Restr</TableHeader>
															<TableHeader>Status</TableHeader>
														</TableRow>
													</TableHead>
													<TableBody>
														{sections.map((section) => (
															<Fragment key={section.sectionCode}>
																{section?.sectionComment && (
																	<TableRow className="col-span-full">
																		<TableCell colSpan={11}>
																			<Text caption>
																				{section.sectionComment}
																			</Text>
																		</TableCell>
																	</TableRow>
																)}
																<TableRow>
																	<TableCell className="px-0!">
																		<Button
																			type="button"
																			plain
																			onClick={() =>
																				handleRemove(section.sectionCode)
																			}
																		>
																			<MinusIcon className="size-4" />
																		</Button>
																	</TableCell>
																	<TableCell>
																		<Button plain>
																			<Text
																				onClick={() =>
																					navigator.clipboard.writeText(
																						section.sectionCode,
																					)
																				}
																			>
																				{section.sectionCode}
																			</Text>
																		</Button>
																	</TableCell>
																	<TableCell className="grid grid-rows-3">
																		<Strong caption>
																			{section.sectionType}
																		</Strong>
																		<Text caption>
																			Sec: <Strong>{section.sectionNum}</Strong>
																		</Text>
																		<Text caption>
																			Units: <Strong>{section.units}</Strong>
																		</Text>
																	</TableCell>
																	<TableCell>
																		{section.instructors.map((instructor) => (
																			<Strong key={instructor} caption>
																				{instructor}
																			</Strong>
																		))}
																	</TableCell>
																	<TableCell>
																		{section.meetings.map((meeting, idx) => {
																			if (meeting.timeIsTBA) {
																				return (
																					<Text key={idx} caption>
																						TBA
																					</Text>
																				);
																			}
																			// Create Date objects with the time (date doesn't matter)
																			const startDate = new Date();
																			startDate.setHours(
																				meeting.startTime.hour,
																				meeting.startTime.minute,
																				0,
																				0,
																			);
																			const endDate = new Date();
																			endDate.setHours(
																				meeting.endTime.hour,
																				meeting.endTime.minute,
																				0,
																				0,
																			);
																			return (
																				<Strong key={idx} caption>
																					{format(startDate, 'h:mm a')}-
																					{format(endDate, 'h:mm a')}
																				</Strong>
																			);
																		})}
																	</TableCell>
																	<TableCell>
																		<Text caption>
																			<Strong>
																				{
																					section.numCurrentlyEnrolled
																						.totalEnrolled
																				}
																			</Strong>
																			/{section.maxCapacity}
																		</Text>
																		<Text caption>
																			WL:{' '}
																			<Strong>{section.numOnWaitlist}</Strong>/
																			{section.numWaitlistCap}
																		</Text>
																		<Text caption>
																			NOR:{' '}
																			<Strong>
																				{section.numNewOnlyReserved}
																			</Strong>
																		</Text>
																	</TableCell>
																	<TableCell>
																		<TextLink href="#">
																			<Text caption>
																				{section.restrictions}
																			</Text>
																		</TextLink>
																	</TableCell>
																	<TableCell>
																		<Text caption>{section.status}</Text>
																	</TableCell>
																</TableRow>
															</Fragment>
														))}
													</TableBody>
												</Table>
											</Fragment>
										);
									})}
								</Fragment>
							);
						})}
					</div>
				)}
			</div>
		)
	);
}
