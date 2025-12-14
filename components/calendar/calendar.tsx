'use client';

import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { transformCalendarEvents } from '@/lib/calendar/calendar-events-helper';
import { CalendarList } from './calendar-event';
import { useCalendarContext } from './calendar-provider';

export default function Calendar() {
  const { calendarEvents, activeTerm } = useCalendarContext();
  const dbCalendarEvents = useQuery(api.calendar.getUserEvents);

  const dbCalendarEventsNoUserId =
    dbCalendarEvents?.map(({ userId: _, ...rest }) => rest) ?? [];

  const transformedEvents = transformCalendarEvents(
    calendarEvents.filter((event) => event.termId === activeTerm?._id)
  );
  const transformedDbEvents = transformCalendarEvents(dbCalendarEventsNoUserId);

  return (
    <div className="flex h-full flex-col">
      <div className="isolate flex flex-auto flex-col bg-white">
        <div
          style={{ width: '165%' }}
          className="flex max-w-full flex-none flex-col h-full"
        >
          <div className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5">
            <div className="grid grid-cols-5 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 ">
              <div className="col-end-1 w-14 ml-px" />
              <div className="flex items-center justify-center py-3">
                <span>Mon</span>
              </div>
              <div className="flex items-center justify-center py-3">
                <span>Tue</span>
              </div>
              <div className="flex items-center justify-center py-3">
                <span className="flex items-baseline">Wed</span>
              </div>
              <div className="flex items-center justify-center py-3">
                <span>Thu</span>
              </div>
              <div className="flex items-center justify-center py-3">
                <span>Fri</span>
              </div>
            </div>
          </div>
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                style={{ gridTemplateRows: 'repeat(32, 1fr)' }}
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
              >
                {[
                  '',
                  '8AM',
                  '9AM',
                  '10AM',
                  '11AM',
                  '12PM',
                  '1PM',
                  '2PM',
                  '3PM',
                  '4PM',
                  '5PM',
                  '6PM',
                  '7PM',
                  '8PM',
                  '9PM',
                  '10PM',
                ].flatMap((time) => [
                  <div key={`label-${time}`}>
                    <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                      {time}
                    </div>
                  </div>,
                  <div key={`spacer-${time}`} />,
                ])}
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 grid grid-rows-1 divide-x divide-gray-100 grid-cols-5">
                <div className="col-start-1 row-span-full" />
                <div className="col-start-2 row-span-full" />
                <div className="col-start-3 row-span-full" />
                <div className="col-start-4 row-span-full" />
                <div className="col-start-5 row-span-full" />
              </div>

              {/* Events */}
              <CalendarList>
                <Authenticated>{transformedDbEvents}</Authenticated>
                <Unauthenticated>{transformedEvents}</Unauthenticated>
              </CalendarList>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
