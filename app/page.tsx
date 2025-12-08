import Calendar from '@/components/calendar/calendar';
import CalendarTabs from '@/components/calendar/calendar-tabs';
import SearchForm from '@/components/calendar/search-form';
import { TabProvider } from '@/components/calendar/tab-context';
import { getWebSocTerms } from './actions';

export default async function Home() {
  const websocTerms = await getWebSocTerms();
  return (
    <div className="grid grid-cols-2 h-screen">
      <section className="border-r border-gray-100">
        <Calendar />
      </section>
      <section className="h-full overflow-y-auto">
        <TabProvider>
          <CalendarTabs />
          <div className="flex-1 overflow-y-auto p-4">
            <SearchForm websocTerms={websocTerms} />
          </div>
        </TabProvider>
      </section>
    </div>
  );
}
