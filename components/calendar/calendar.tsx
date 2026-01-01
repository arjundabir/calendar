'use client';

import { CalendarEvent, CalendarList } from './calendar-event';
import { normalizeEvents } from '@/utils/calendar/calendar-normalizer';
import { renderNormalizedEvents } from '@/utils/calendar/calendar-renderer';
import { useCalendarEvent } from '@/hooks/use-calendar-effect';

export default function Calendar() {
  const events = useCalendarEvent();
  const renderEvents = events
    ? renderNormalizedEvents(normalizeEvents(events))
    : null;
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
                {renderEvents?.map((re) => (
                  <CalendarEvent
                    key={`${re._id}-${re.dayOfWeek}`}
                    dayOfWeek={re.dayOfWeek}
                    startTime={re.startTime}
                    endTime={re.endTime}
                    color={re.color!}
                    deptCode={re.deptCode}
                    courseNumber={re.courseNumber}
                    sectionType={re.sectionType}
                    sectionCode={re.sectionCode}
                    finalExam={re.finalExam}
                    locations={re.bldg}
                    instructors={re.instructors}
                    overlapCount={re.overlapCount!}
                    overlapIndex={re.overlapIndex!}
                  />
                ))}
                {/* TODO (@arjundabir): implement finals schedule handling */}
              </CalendarList>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
