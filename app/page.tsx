import Calendar from '@/components/calendar/calendar';
import CalendarTabs from '@/components/calendar/calendar-tabs';
import SearchInput from '@/components/calendar/search-input';
import { TabProvider } from '@/components/calendar/tab-context';

export default function Home() {
  return (
    <div className="grid grid-cols-2 h-screen">
      <section className="border-r border-gray-100">
        <Calendar />
      </section>
      <section>
        <TabProvider>
          <CalendarTabs />
          <div className="p-4">
            <SearchInput />
          </div>
        </TabProvider>
      </section>
    </div>
  );
}
