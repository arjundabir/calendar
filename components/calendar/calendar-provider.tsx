'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Section, Course, DepartmentInSchool } from '@/types/websoc';
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from '../navbar';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/button';
import { CalendarIcon } from '@heroicons/react/24/solid';

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
      <Navbar>
        <NavbarDivider />
        <NavbarItem>
          <CalendarIcon />
          Calendar by Zotsites
        </NavbarItem>
        <NavbarSpacer />
        <NavbarSection>
          <Unauthenticated>
            <SignInButton>
              <NavbarItem>Login / Sign up</NavbarItem>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
          <AuthLoading>
            <div className="size-7 animate-pulse bg-gray-200 rounded-full" />
          </AuthLoading>
        </NavbarSection>
      </Navbar>
      {children}
    </CalendarContext.Provider>
  );
}
