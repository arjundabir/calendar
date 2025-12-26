'use client';

import { useUser } from '@clerk/nextjs';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react';
import { format, formatDistanceToNow } from 'date-fns';
import { Fragment, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { queryWebSoc } from '@/app/actions';
import { CourseIndex } from '@/app/api/cron/index-courses/route';
import { Select } from '@/components/select';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import type { paths } from '@/types/anteater-api-types';
import {
  Accordion,
  AccordionButton,
  AccordionGroup,
  AccordionPanel,
} from '../accordion';
import { Button } from '../button';
import { Combobox, ComboboxLabel, ComboboxOption } from '../combobox';
import { Heading, Subheading } from '../heading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';
import { Strong, Text, TextLink } from '../text';
import { useCalendarContext } from './calendar-provider';
import { useTabContext } from './tab-context';

type Term =
  paths['/v2/rest/websoc/terms']['get']['responses'][200]['content']['application/json']['data'][number];
type WebSocEndpoint = paths['/v2/rest/websoc']['get'];
type WebSocData =
  WebSocEndpoint['responses'][200]['content']['application/json']['data'];
type WebSocQuarter = NonNullable<
  WebSocEndpoint['parameters']['query']
>['quarter'];

const searchCourseSchema = z.object({
  term: z.string(),
  course: z.string().nonempty(),
});
type SearchCourseType = z.infer<typeof searchCourseSchema>;

export default function SearchForm({ websocTerms }: { websocTerms: Term[] }) {
  const [webSocData, setWebSocData] = useState<WebSocData | null>(null);
  const [coursesIndex, setCoursesIndex] = useState<CourseIndex[]>([]);

  useEffect(() => {
    async function getCoursesIndex() {
      const response = await fetch('/api/search/suggestions', {
        cache: 'force-cache',
        next: {
          revalidate: 60 * 60 * 24 * 30,
        },
      });
      const coursesIndex = (await response.json()) as CourseIndex[];
      setCoursesIndex(coursesIndex);
    }
    getCoursesIndex();
  }, []);
  const { tabs } = useTabContext();

  const { isSignedIn } = useUser();
  const { calendarEvents, setCalendarEvents, removeCalendarEvent, activeTerm } =
    useCalendarContext();

  const initialValues: SearchCourseType = {
    term: websocTerms[0].shortName,
    course: '',
  };

  const { handleSubmit, control } = useForm({
    defaultValues: initialValues,
  });

  async function onSubmit(values: SearchCourseType) {
    const validSchema = searchCourseSchema.safeParse(values);

    if (!validSchema.success) {
      console.error(validSchema.error);
      alert("your input doesn't make sense");
      return;
    }

    const [year, quarter] = validSchema.data.term.split(' ');
    const courseList = validSchema.data.course.split(' ');
    const courseNumber = courseList.pop()?.toUpperCase();
    const department = courseList.join(' ').toUpperCase();

    const response = await queryWebSoc({
      year,
      quarter: quarter as WebSocQuarter,
      department,
      courseNumber,
    });
    setWebSocData(response);
  }

  function sectionAdded(sectionCode: string) {
    return calendarEvents.some(
      (calendarEvent) => calendarEvent.sectionCode === sectionCode
    );
  }

  const getCalendarEvents = useQuery(api.events.queries.getUserEvents);
  const addToCalendarDb = useMutation(
    api.events.mutations.createCalendarEvent
  ).withOptimisticUpdate((localStore, args) => {
    const currentEvents = localStore.getQuery(api.events.queries.getUserEvents);
    if (!currentEvents) return;

    const userId =
      currentEvents[0]?.userId ??
      ({ __tableName: 'users' } as (typeof currentEvents)[0]['userId']);

    const tempEvent = {
      userId,
      calendarId: args.event.calendarId,
      event: args.event,
      _id: `temp_${args.event.sectionCode}` as (typeof currentEvents)[0]['_id'],
      _creationTime: Date.now(),
    };

    const updatedEvents = [...currentEvents, tempEvent];
    localStore.setQuery(api.events.queries.getUserEvents, {}, updatedEvents);
  });
  const deleteCalendarEvent = useMutation(
    api.events.mutations.deleteCalendarEvent
  ).withOptimisticUpdate((localStore, args) => {
    const currentEvents = localStore.getQuery(api.events.queries.getUserEvents);
    if (!currentEvents) return;

    const updatedEvents = currentEvents.filter(
      (event) => event.event.sectionCode !== args.sectionCode
    );
    localStore.setQuery(api.events.queries.getUserEvents, {}, updatedEvents);
  });

  return (
    tabs[0].current && (
      <div className="flex-1 overflow-y-auto p-4">
        <form className="flex gap-1" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="term"
            control={control}
            render={({ field }) => (
              <Select
                className="max-w-fit"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleSubmit(onSubmit)();
                }}
              >
                <option value="" disabled>
                  Select a term
                </option>
                {websocTerms.map((term) => (
                  <option key={term.shortName} value={term.shortName}>
                    {term.longName}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            name="course"
            control={control}
            render={({ field }) => (
              <Combobox
                options={coursesIndex}
                displayValue={(course) =>
                  course ? `${course.department} ${course.courseNumber}` : ''
                }
                value={
                  coursesIndex.find(
                    (course) =>
                      `${course.department} ${course.courseNumber}` ===
                      field.value
                  ) || null
                }
                onChange={(course) => {
                  if (course && course.department && course.courseNumber) {
                    field.onChange(
                      `${course.department} ${course.courseNumber}`
                    );
                    handleSubmit(onSubmit)();
                  } else field.onChange('');
                }}
                placeholder="Search courses"
              >
                {(course) => (
                  <ComboboxOption value={course}>
                    <ComboboxLabel>
                      {course.department} {course.courseNumber}: {course.title}
                    </ComboboxLabel>
                  </ComboboxOption>
                )}
              </Combobox>
            )}
          />
          <Button outline type="submit">
            Search
          </Button>
        </form>
        {webSocData && (
          <div className="mt-6">
            {webSocData.schools.length > 0 ? (
              webSocData.schools.map((school) => (
                <Fragment key={school.schoolName}>
                  <AccordionGroup>
                    <Accordion className="-mx-4">
                      <AccordionButton className="justify-between">
                        <Heading key={school.schoolName} level={2}>
                          {school.schoolName}
                        </Heading>
                        {school.updatedAt && (
                          <Text caption>
                            Updated{' '}
                            {formatDistanceToNow(new Date(school.updatedAt), {
                              addSuffix: true,
                            })}
                          </Text>
                        )}
                      </AccordionButton>
                      <AccordionPanel>
                        <Text
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: we trust the data
                          dangerouslySetInnerHTML={{
                            __html: school.schoolComment,
                          }}
                        />
                      </AccordionPanel>
                    </Accordion>
                    {school.departments.map((department) => (
                      <div key={department.deptCode}>
                        {department.sectionCodeRangeComments.length ? (
                          <Accordion className="-mx-4">
                            <AccordionButton className="justify-between">
                              <Heading level={4}>{department.deptName}</Heading>
                              {department.updatedAt && (
                                <Text caption>
                                  Updated{' '}
                                  {formatDistanceToNow(
                                    new Date(department.updatedAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </Text>
                              )}
                            </AccordionButton>
                            <AccordionPanel>
                              {department.sectionCodeRangeComments?.map(
                                (sectionCodeRangeComment) => (
                                  <Text
                                    key={sectionCodeRangeComment}
                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: we trust the data
                                    dangerouslySetInnerHTML={{
                                      __html: sectionCodeRangeComment,
                                    }}
                                  />
                                )
                              )}
                            </AccordionPanel>
                          </Accordion>
                        ) : (
                          <div className="flex w-full items-center justify-between gap-x-4 py-3 text-left text-base/6 font-semibold text-zinc-950 sm:py-2.5 sm:text-sm/6 dark:text-white">
                            <Heading level={4}>{department.deptName}</Heading>
                            {department.updatedAt && (
                              <Text caption>
                                Updated{' '}
                                {formatDistanceToNow(
                                  new Date(department.updatedAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </Text>
                            )}
                          </div>
                        )}
                        {department.courses.map((course) => (
                          <Fragment key={course.deptCode}>
                            <div className="flex justify-between">
                              <div>
                                <Subheading>
                                  {course.deptCode} {course.courseNumber} •{' '}
                                  {course.courseTitle}
                                </Subheading>
                                <Text
                                  // biome-ignore lint/security/noDangerouslySetInnerHtml: we trust the data
                                  dangerouslySetInnerHTML={{
                                    __html: course.courseComment,
                                  }}
                                />
                              </div>
                              {course.updatedAt && (
                                <Text caption>
                                  Updated at{' '}
                                  {formatDistanceToNow(course.updatedAt)}
                                </Text>
                              )}
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
                                {course.sections.map((section) => (
                                  <Fragment key={section.sectionCode}>
                                    {section?.sectionComment && (
                                      <TableRow className="col-span-full">
                                        <TableCell colSpan={11}>
                                          <Text
                                            caption
                                            // biome-ignore lint/security/noDangerouslySetInnerHtml: we trust the data
                                            dangerouslySetInnerHTML={{
                                              __html: section.sectionComment,
                                            }}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    )}
                                    <TableRow>
                                      <Authenticated>
                                        <TableCell className="px-0!">
                                          {getCalendarEvents?.some(
                                            (calendarEvent) =>
                                              calendarEvent.event
                                                .sectionCode ===
                                              section.sectionCode
                                          ) ? (
                                            <Button
                                              type="button"
                                              plain
                                              onClick={() => {
                                                deleteCalendarEvent({
                                                  sectionCode:
                                                    section.sectionCode,
                                                });
                                              }}
                                            >
                                              <MinusIcon className="size-4" />
                                            </Button>
                                          ) : (
                                            <Button
                                              type="button"
                                              plain
                                              onClick={() => {
                                                const calendarEvent = {
                                                  ...section,
                                                  deptCode: course.deptCode,
                                                  courseNumber:
                                                    course.courseNumber,
                                                  deptName: department.deptName,
                                                  calendarId: (
                                                    activeTerm as Doc<'calendars'>
                                                  )?._id,
                                                };
                                                addToCalendarDb({
                                                  event: calendarEvent,
                                                });
                                              }}
                                            >
                                              <PlusIcon className="size-4" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </Authenticated>
                                      <Unauthenticated>
                                        <TableCell className="px-0!">
                                          {sectionAdded(section.sectionCode) ? (
                                            <Button
                                              type="button"
                                              plain
                                              onClick={() => {
                                                removeCalendarEvent(
                                                  section.sectionCode
                                                );
                                              }}
                                            >
                                              <MinusIcon className="size-4" />
                                            </Button>
                                          ) : (
                                            <Button
                                              type="button"
                                              plain
                                              onClick={() => {
                                                const calendarName =
                                                  activeTerm?.calendarName ||
                                                  '';
                                                const calendarEvent = {
                                                  ...section,
                                                  deptCode: course.deptCode,
                                                  courseNumber:
                                                    course.courseNumber,
                                                  deptName: department.deptName,
                                                  calendarId: calendarName,
                                                };
                                                setCalendarEvents([
                                                  ...calendarEvents,
                                                  calendarEvent,
                                                ]);
                                              }}
                                            >
                                              <PlusIcon className="size-4" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </Unauthenticated>

                                      <TableCell>
                                        <Button plain>
                                          <Text
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                section.sectionCode
                                              );
                                              toast.success(
                                                'Copied to clipboard'
                                              );
                                            }}
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
                                          Sec:{' '}
                                          <Strong>{section.sectionNum}</Strong>
                                        </Text>
                                        <Text caption>
                                          Units:
                                          <Strong> {section.units}</Strong>
                                        </Text>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-x-2">
                                          {section.instructors.map(
                                            (instructor) => (
                                              <Strong key={instructor} caption>
                                                {instructor}
                                              </Strong>
                                            )
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {section.meetings.map(
                                          (meeting, meetingIndex) => {
                                            if (meeting.timeIsTBA) {
                                              return (
                                                <Text
                                                  key={`${meetingIndex}-${meeting.timeIsTBA}`}
                                                  caption
                                                >
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
                                              0
                                            );
                                            const endDate = new Date();
                                            endDate.setHours(
                                              meeting.endTime.hour,
                                              meeting.endTime.minute,
                                              0,
                                              0
                                            );
                                            return (
                                              <Strong
                                                key={`${meetingIndex}-${meeting.timeIsTBA}`}
                                                caption
                                              >
                                                {format(startDate, 'h:mm a')}-
                                                {format(endDate, 'h:mm a')}
                                              </Strong>
                                            );
                                          }
                                        )}
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
                                          <Strong>
                                            {section.numOnWaitlist}
                                          </Strong>
                                          /{section.numWaitlistCap}
                                        </Text>
                                        <Text caption>
                                          NOR:{' '}
                                          <Strong>
                                            {section.numNewOnlyReserved}
                                          </Strong>
                                        </Text>
                                      </TableCell>
                                      <TableCell>
                                        <TextLink
                                          href={course.prerequisiteLink}
                                        >
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
                        ))}
                      </div>
                    ))}
                  </AccordionGroup>
                </Fragment>
              ))
            ) : (
              <div className="flex items-center justify-center py-12">
                <Text className="text-zinc-500 dark:text-zinc-400">
                  No search results found
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    )
  );
}
