'use client';

import { Select } from '@/components/select';
import { Button } from '../button';
import { Input } from '../input';
import { QueryWebSocParams, Term, WebSocQuerySuccess } from '@/types/websoc';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { queryWebSoc } from '@/app/actions';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';
import { PlusIcon } from '@heroicons/react/24/solid';

const searchCourseSchema = z.object({
  term: z.string(),
  course: z.string().nonempty(),
});
type SearchCourseType = z.infer<typeof searchCourseSchema>;

export default function SearchForm({ websocTerms }: { websocTerms: Term[] }) {
  const [coursesData, setCoursesData] = useState<
    WebSocQuerySuccess['data'] | null
  >(null);

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
    const courseNumber = courseList.pop();
    const department = courseList.join(' ');

    const response = await queryWebSoc({
      year,
      quarter: quarter as QueryWebSocParams['quarter'],
      department,
      courseNumber,
    });
    setCoursesData(response);
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
      {coursesData && (
        <div className="mt-6">
          <Table striped className="table-auto">
            <TableHead className="">
              <TableRow>
                <TableHeader />
                <TableHeader>Department</TableHeader>
                <TableHeader>Course Number</TableHeader>
                <TableHeader>Course Title</TableHeader>
                <TableHeader>Sections</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {coursesData.schools.flatMap((school) =>
                school.departments.flatMap((dept) =>
                  dept.courses.map((course) => (
                    <TableRow key={`${course.deptCode}-${course.courseNumber}`}>
                      <TableCell>
                        <Button plain>
                          <PlusIcon className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{course.deptCode}</TableCell>
                      <TableCell>{course.courseNumber}</TableCell>
                      <TableCell>{course.courseTitle}</TableCell>
                      <TableCell>{course.sections.length}</TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
