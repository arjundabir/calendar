'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Section, Course, DepartmentInSchool } from '@/types/websoc';

export interface CalendarEvents
  extends Section,
    Pick<Course, 'deptCode'>,
    Pick<DepartmentInSchool, 'deptName'>,
    Pick<Course, 'courseNumber'> {}

type CalendarContextType = {
  calendarEvents: CalendarEvents[] | [];
  setCalendarEvents: (events: CalendarEvents[] | []) => void;
  removeCalendarEvent: (sectionCode: string) => void;
};

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      'useCalendarContext must be used within a CalendarProvider'
    );
  }
  return context;
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [calendarEvents, setCalendarEvents] = useLocalStorage<
    CalendarContextType['calendarEvents']
  >('calendar', []);

  function removeCalendarEvent(sectionCode: string): void {
    setCalendarEvents(
      calendarEvents.filter((event) => event.sectionCode !== sectionCode)
    );
  }

  return (
    <CalendarContext.Provider
      value={{ calendarEvents, setCalendarEvents, removeCalendarEvent }}
    >
      {children}
    </CalendarContext.Provider>
  );
}
