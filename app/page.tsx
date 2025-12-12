import Calendar from '@/components/calendar/calendar';
import CalendarTabs from '@/components/calendar/calendar-tabs';
import SearchForm from '@/components/calendar/search-form';
import { TabProvider } from '@/components/calendar/tab-context';
import { CalendarProvider } from '@/components/calendar/calendar-provider';
import { getWebSocTerms } from './actions';
import { AddedCourses } from '@/components/calendar/added-courses';
import fs from 'fs';

export default async function Home() {
  const websocTerms = await getWebSocTerms();
  const coursesIndex = JSON.parse(
    await fs.promises.readFile(
      process.cwd() + '/public/course-index.json',
      'utf8'
    )
  );
  return (
    <CalendarProvider>
      <div className="grid grid-cols-2 h-[calc(100svh-56px)]">
        <section className="border-r border-gray-100">
          <Calendar />
        </section>
        <section className="h-full overflow-y-auto ring-1 ring-black/5 shadow">
          <TabProvider>
            <CalendarTabs />
            <SearchForm websocTerms={websocTerms} coursesIndex={coursesIndex} />
            <AddedCourses />
          </TabProvider>
        </section>
      </div>
    </CalendarProvider>
  );
}
