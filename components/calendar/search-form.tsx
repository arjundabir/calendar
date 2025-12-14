'use client';

import { Select } from '@/components/select';
import { Button } from '../button';
import { paths } from '@/types/anteater-api-types';
import z from 'zod';

type Term =
  paths['/v2/rest/websoc/terms']['get']['responses'][200]['content']['application/json']['data'][number];
type WebSocEndpoint = paths['/v2/rest/websoc']['get'];
type WebSocData =
  WebSocEndpoint['responses'][200]['content']['application/json']['data'];
type WebSocQuarter = NonNullable<
  WebSocEndpoint['parameters']['query']
>['quarter'];
import { useForm, Controller } from 'react-hook-form';
import { queryWebSoc } from '@/app/actions';
import { Fragment, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Heading, Subheading } from '../heading';
import { Strong, Text, TextLink } from '../text';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Accordion,
  AccordionButton,
  AccordionGroup,
  AccordionPanel,
} from '../accordion';
import { useCalendarContext } from './calendar-provider';
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useTabContext } from './tab-context';
import { Combobox, ComboboxLabel, ComboboxOption } from '../combobox';
import { CourseIndex } from '@/app/api/cron/index-courses/route';

const searchCourseSchema = z.object({
  term: z.string(),
  course: z.string().nonempty(),
});
type SearchCourseType = z.infer<typeof searchCourseSchema>;

export default function SearchForm({
  websocTerms,
  coursesIndex,
}: {
  websocTerms: Term[];
  coursesIndex: CourseIndex[];
}) {
  const [webSocData, setWebSocData] = useState<WebSocData | null>(null);
  const { tabs } = useTabContext();

  const { user, isSignedIn } = useUser();
  const { calendarEvents, setCalendarEvents, removeCalendarEvent } =
    useCalendarContext();

  const initialValues: SearchCourseType = {
    term: websocTerms[0].shortName,
    course: '',
  };

  const { handleSubmit, register, control } = useForm({
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

  const addToCalendarDb = useMutation(api.calendar.createCalendarEvent);
  const deleteCalendarEvent = useMutation(api.calendar.deleteCalendarEvent);
  const getCalendarEvents = useQuery(api.calendar.getUserEvents);

  return (
    tabs[0].current && (
      <div className="flex-1 overflow-y-auto p-4">
        <form className="flex gap-1" onSubmit={handleSubmit(onSubmit)}>
          <Select className="max-w-fit" {...register('term')}>
            <option value="" disabled>
              Select a term
            </option>
            {websocTerms.map((term) => (
              <option key={term.shortName} value={term.shortName}>
                {term.longName}
              </option>
            ))}
          </Select>
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
                              {department.sectionCodeRangeComments &&
                                department.sectionCodeRangeComments.map(
                                  (sectionCodeRangeComment, index) => (
                                    <Text
                                      key={index}
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
                                              calendarEvent.sectionCode ===
                                              section.sectionCode
                                          ) ? (
                                            <Button
                                              type="button"
                                              plain
                                              onClick={() => {
                                                if (isSignedIn) {
                                                  deleteCalendarEvent({
                                                    sectionCode:
                                                      section.sectionCode,
                                                  });
                                                } else {
                                                  removeCalendarEvent(
                                                    section.sectionCode
                                                  );
                                                }
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
                                                };
                                                if (isSignedIn) {
                                                  const calendarEventWithUserId =
                                                    {
                                                      ...calendarEvent,
                                                      userId: user.id,
                                                    };
                                                  addToCalendarDb({
                                                    event:
                                                      calendarEventWithUserId,
                                                  });
                                                }
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
                                                // TODO: fix auth and unauth state later
                                                if (isSignedIn) {
                                                  deleteCalendarEvent({
                                                    sectionCode:
                                                      section.sectionCode,
                                                  });
                                                } else {
                                                  removeCalendarEvent(
                                                    section.sectionCode
                                                  );
                                                }
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
                                                };
                                                if (isSignedIn) {
                                                  const calendarEventWithUserId =
                                                    {
                                                      ...calendarEvent,
                                                      userId: user.id,
                                                    };
                                                  addToCalendarDb({
                                                    event:
                                                      calendarEventWithUserId,
                                                  });
                                                } else {
                                                  setCalendarEvents([
                                                    ...calendarEvents,
                                                    calendarEvent,
                                                  ]);
                                                }
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
                                            onClick={() =>
                                              navigator.clipboard.writeText(
                                                section.sectionCode
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
                                          Sec:{' '}
                                          <Strong>{section.sectionNum}</Strong>
                                        </Text>
                                        <Text caption>
                                          Units:
                                          <Strong> {section.units}</Strong>
                                        </Text>
                                      </TableCell>
                                      <TableCell>
                                        {section.instructors.map(
                                          (instructor) => (
                                            <Strong key={instructor} caption>
                                              {instructor}
                                            </Strong>
                                          )
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {section.meetings.map(
                                          (meeting, idx) => {
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
                                              <Strong key={idx} caption>
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
