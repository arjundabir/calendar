import Calendar from '@/components/calendar/calendar';
import CalendarTabs from '@/components/calendar/calendar-tabs';
import SearchForm from '@/components/calendar/search-form';
import { TabProvider } from '@/components/calendar/tab-context';
import { CalendarProvider } from '@/components/calendar/calendar-provider';
import { getWebSocTerms, listAllCalendars } from './actions';
import { AddedCourses } from '@/components/calendar/added-courses';
import { getLatestSocAvailable } from '@/lib/calendar/terms-helper';
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export default async function Home() {
  const [websocTerms, allCalendars, preloadedTerms] = await Promise.all([
    getWebSocTerms(),
    listAllCalendars(),
    preloadQuery(api.calendars.queries.getCalendars),
  ]);

  return (
    <CalendarProvider
      latestTerm={getLatestSocAvailable(allCalendars)}
      preloadedTerms={preloadedTerms}
    >
      <div className="grid grid-cols-2 h-[calc(100svh-56px)]">
        <section className="border-r border-gray-100">
          <Calendar />
        </section>
        <section className="h-full overflow-y-auto ring-1 ring-black/5 shadow">
          <TabProvider>
            <CalendarTabs />
            <SearchForm websocTerms={websocTerms} />
            <AddedCourses />
          </TabProvider>
        </section>
      </div>
    </CalendarProvider>
  );
}
