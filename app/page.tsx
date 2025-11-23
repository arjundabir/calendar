import Calendar from '@/components/calendar/calendar';
import CalendarTabs from '@/components/calendar/calendar-tabs';
import { ChevronDownIcon } from '@heroicons/react/16/solid';

export default function Home() {
  return (
    <div className="grid grid-cols-2 h-screen">
      <section className="border-r border-gray-100">
        <Calendar />
      </section>
      <section className="">
        <CalendarTabs />
      </section>
    </div>
  );
}
