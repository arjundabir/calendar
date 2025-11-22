import Calendar from '@/components/calendar/calendar';

export default function Home() {
  return (
    <div className="grid grid-cols-2 h-screen">
      <section className="border-r border-gray-100">
        <Calendar />
      </section>
      <section className="">
        <div>hello world</div>
      </section>
    </div>
  );
}
