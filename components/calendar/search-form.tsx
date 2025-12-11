'use client';

import { Select } from '@/components/select';
import { Button } from '../button';
import { Input } from '../input';
import {
  QueryWebSocParams,
  SectionSchema,
  Term,
  WebSocQuerySuccess,
} from '@/types/websoc';
import z from 'zod';
import { useForm } from 'react-hook-form';
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

const searchCourseSchema = z.object({
  term: z.string(),
  course: z.string().nonempty(),
});
type SearchCourseType = z.infer<typeof searchCourseSchema>;

export default function SearchForm({ websocTerms }: { websocTerms: Term[] }) {
  const [webSocData, setWebSocData] = useState<
    WebSocQuerySuccess['data'] | null
  >(null);
  const { calendarEvents, setCalendarEvents, removeCalendarEvent } =
    useCalendarContext();

  const initialValues: SearchCourseType = {
    term: websocTerms[0].shortName,
    course: '',
  };

  const { handleSubmit, register } = useForm({
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
      quarter: quarter as QueryWebSocParams['quarter'],
      department,
      courseNumber,
    });
    setWebSocData(response);
  }

  function sectionAdded(
    sectionCode: z.infer<typeof SectionSchema>['sectionCode']
  ) {
    return calendarEvents.some(
      (calendarEvent) => calendarEvent.sectionCode === sectionCode
    );
  }

  return (
    <div>
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

        <Input placeholder="Search courses" {...register('course')} />
        <Button outline type="submit">
          Search
        </Button>
      </form>
      {webSocData && (
        <div className="mt-6">
          {webSocData.schools.map((school) => (
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
                      dangerouslySetInnerHTML={{ __html: school.schoolComment }}
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
                              Updated at {formatDistanceToNow(course.updatedAt)}
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
                                      <Text caption>
                                        {section.sectionComment}
                                      </Text>
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow>
                                  <TableCell className="px-0!">
                                    {sectionAdded(section.sectionCode) ? (
                                      <Button
                                        type="button"
                                        plain
                                        onClick={() =>
                                          removeCalendarEvent(
                                            section.sectionCode
                                          )
                                        }
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
                                            courseNumber: course.courseNumber,
                                            deptName: department.deptName,
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
                                      Sec: <Strong>{section.sectionNum}</Strong>
                                    </Text>
                                    <Text caption>
                                      Units:<Strong> {section.units}</Strong>
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
                                    <TextLink href={course.prerequisiteLink}>
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
          ))}
        </div>
      )}
    </div>
  );
}
