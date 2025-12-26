'use client';

import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { CalendarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import {
  Authenticated,
  AuthLoading,
  type Preloaded,
  Unauthenticated,
  useMutation,
  usePreloadedQuery,
  useQuery,
} from 'convex/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
import type { paths } from '@/types/anteater-api-types';
import { Checkbox, CheckboxField, CheckboxGroup } from '../checkbox';
import { Description } from '../fieldset';
import { Input } from '../input';
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '../navbar';
import ShareModal from '../share-modal';
import {
  Sidebar,
  SidebarBody,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '../sidebar';

// Navigate through the nested websoc response structure to get the correct types
type WebSocData =
  paths['/v2/rest/websoc']['get']['responses'][200]['content']['application/json']['data'];
type WebSocSection =
  WebSocData['schools'][number]['departments'][number]['courses'][number]['sections'][number];
type WebSocCourse =
  WebSocData['schools'][number]['departments'][number]['courses'][number];
type WebSocDepartment = WebSocData['schools'][number]['departments'][number];
type Calendar =
  paths['/v2/rest/calendar']['get']['responses'][200]['content']['application/json']['data'];
type CalendarDoc = Doc<'calendars'>;
type LocalCalendar = Omit<CalendarDoc, '_id' | '_creationTime'>;
export interface CalendarEvents extends WebSocSection {
  deptCode: WebSocCourse['deptCode'];
  courseNumber: WebSocCourse['courseNumber'];
  deptName: WebSocDepartment['deptName'];
  calendarId: string;
}

type Event = Doc<'events'>['event'];

type LocalStorageEvent = {
  calendarName: string;
  events: Event[];
};

type CalendarContextType = {
  calendarEvents: CalendarEvents[] | [];
  setCalendarEvents: (events: CalendarEvents[] | []) => void;
  removeCalendarEvent: (sectionCode: string) => void;
  activeTerm: (Doc<'calendars'> | LocalCalendar) | undefined;
  isFinalsSchedule: boolean;
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

export function CalendarProvider({
  children,
  latestTerm,
  preloadedTerms,
}: {
  children: ReactNode;
  latestTerm: Calendar;
  preloadedTerms: Preloaded<typeof api.calendars.queries.getCalendars>;
}) {
  const [localStorageEvents, setLocalStorageEvents] = useLocalStorage<
    LocalStorageEvent[]
  >('events', []);
  const [calendarsLocalStorage, setCalendarsLocalStorage] = useLocalStorage<
    LocalCalendar[]
  >('calendars', []);
  const [isFinalsSchedule, setIsFinalsSchedule] = useState<boolean>(false);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  const { isAuthenticated } = useStoreUserEffect();
  const calendars = usePreloadedQuery(preloadedTerms);
  const activeTerm = isAuthenticated
    ? calendars?.find((calendar) => calendar.isActive)
    : calendarsLocalStorage.find((calendar) => calendar.isActive);

  // Helper: Convert EventValidatorType to CalendarEvents by adding calendarId
  function eventToCalendarEvent(
    event: Event,
    calendarName: string
  ): CalendarEvents {
    return {
      ...event,
      calendarId: calendarName,
    } as CalendarEvents;
  }

  // Helper: Convert CalendarEvents to EventValidatorType by removing calendarId
  function calendarEventToEvent(calendarEvent: CalendarEvents): Event {
    const { ...event } = calendarEvent;
    return event as Event;
  }

  // Helper: Get events for a specific calendarName
  function getEventsForCalendar(calendarName: string): Event[] {
    const calendarGroup = localStorageEvents.find(
      (group) => group.calendarName === calendarName
    );
    return calendarGroup?.events ?? [];
  }

  // Helper: Flatten grouped structure to CalendarEvents array filtered by calendarName
  function getFlattenedEvents(calendarName?: string): CalendarEvents[] {
    if (!calendarName) return [];
    const events = getEventsForCalendar(calendarName);
    return events.map((event) => eventToCalendarEvent(event, calendarName));
  }

  // Get flattened events for active term
  const calendarEvents = getFlattenedEvents(activeTerm?.calendarName);

  // Helper: Remove event from correct calendar group
  function removeEventFromCalendar(
    sectionCode: string,
    calendarName: string
  ): void {
    const currentEvents = [...localStorageEvents];
    const calendarIndex = currentEvents.findIndex(
      (group) => group.calendarName === calendarName
    );

    if (calendarIndex >= 0) {
      const updatedEvents = currentEvents[calendarIndex].events.filter(
        (event) => event.sectionCode !== sectionCode
      );

      if (updatedEvents.length === 0) {
        // Remove calendar group if no events left
        currentEvents.splice(calendarIndex, 1);
      } else {
        currentEvents[calendarIndex] = {
          ...currentEvents[calendarIndex],
          events: updatedEvents,
        };
      }

      setLocalStorageEvents(currentEvents);
    }
  }

  // setCalendarEvents: accepts CalendarEvents[] and stores them grouped by calendarName
  function setCalendarEvents(events: CalendarEvents[]): void {
    if (!activeTerm?.calendarName) return;

    // Group events by calendarName (though they should all be for activeTerm)
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      const calendarName = event.calendarId || activeTerm.calendarName;
      if (!grouped[calendarName]) {
        grouped[calendarName] = [];
      }
      grouped[calendarName].push(calendarEventToEvent(event));
    });

    // Update localStorage
    const currentEvents = [...localStorageEvents];
    Object.entries(grouped).forEach(([calendarName, eventList]) => {
      const calendarIndex = currentEvents.findIndex(
        (group) => group.calendarName === calendarName
      );

      if (calendarIndex >= 0) {
        currentEvents[calendarIndex] = {
          calendarName,
          events: eventList,
        };
      } else {
        currentEvents.push({
          calendarName,
          events: eventList,
        });
      }
    });

    setLocalStorageEvents(currentEvents);
  }

  function removeCalendarEvent(sectionCode: string): void {
    if (!activeTerm?.calendarName) return;
    removeEventFromCalendar(sectionCode, activeTerm.calendarName);
  }

  const [isCreatingNewCalendar, setIsCreatingNewCalendar] =
    useState<boolean>(false);
  const sharedCalendars = useQuery(
    api.calendars.queries.getCalendarsSharedWithMe
  );
  const setShareVisibility = useMutation(
    api.shares.mutations.setShareVisibility
  );

  const deleteCalendar = useMutation(
    api.calendars.mutations.deleteCalendar
  ).withOptimisticUpdate((localStore, args) => {
    const calendars = localStore.getQuery(api.calendars.queries.getCalendars);
    if (!calendars) return;

    const updatedCalendars = calendars.filter(
      (calendar) => calendar._id !== args.id
    );
    return updatedCalendars;
  });

  const createCalendar = useMutation(
    api.calendars.mutations.createCalendar
  ).withOptimisticUpdate((localStore, args) => {
    const calendars = localStore.getQuery(api.calendars.queries.getCalendars);
    if (!calendars) return;

    const updatedCalendars = calendars.map((calendar) => ({
      ...calendar,
      isActive: false,
    }));

    updatedCalendars.push({
      _id: `temp_${args.name}` as (typeof calendars)[0]['_id'],
      _creationTime: 0,
      userId: { __tableName: 'users' } as (typeof calendars)[0]['userId'],
      calendarName: args.name,
      isActive: true,
    });

    localStore.setQuery(
      api.calendars.queries.getCalendars,
      {},
      updatedCalendars
    );
  });

  useEffect(() => {
    if (!isAuthenticated) {
      const calendarName = `${latestTerm.quarter} ${latestTerm.year}`;
      const calendarAlreadyExists = calendarsLocalStorage.some(
        (c) => c.calendarName === calendarName
      );
      if (!calendarAlreadyExists) {
        const newCalendar: LocalCalendar = {
          userId: 'local' as Id<'users'>,
          calendarName,
          isActive: true,
        };
        setCalendarsLocalStorage([
          ...calendarsLocalStorage.map((calendar) => ({
            ...calendar,
            isActive: false,
          })),
          newCalendar,
        ]);
      }
      return;
    }

    if (!calendars) return;

    const calendarName = `${latestTerm.quarter} ${latestTerm.year}`;
    const calendarAlreadyExists = calendars?.some(
      (c) => c.calendarName === calendarName
    );
    if (!calendarAlreadyExists) {
      createCalendar({ name: calendarName });
    }
  }, [
    createCalendar,
    isAuthenticated,
    latestTerm.year,
    latestTerm.quarter,
    calendars,
    calendarsLocalStorage,
    setCalendarsLocalStorage,
  ]);

  const setActive = useMutation(
    api.calendars.mutations.setActiveCalendar
  ).withOptimisticUpdate((localStore, args) => {
    const calendars = localStore.getQuery(api.calendars.queries.getCalendars);
    if (!calendars) return;

    const updatedCalendars = calendars.map((calendar) => ({
      ...calendar,
      isActive: calendar._id === args.id,
    }));
    localStore.setQuery(
      api.calendars.queries.getCalendars,
      {},
      updatedCalendars
    );
  });

  return (
    <CalendarContext.Provider
      value={{
        calendarEvents,
        setCalendarEvents,
        removeCalendarEvent,
        activeTerm,
        isFinalsSchedule,
      }}
    >
      <div className="grid grid-cols-[256px_1fr]">
        <Sidebar>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/">
                <CalendarIcon />
                <SidebarLabel>Calendar by Zotsites</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarSection>
              <SidebarHeading>My Calendars</SidebarHeading>
              <Authenticated>
                {calendars?.map((calendar) => (
                  <SidebarItem
                    key={calendar._id}
                    onClick={() => {
                      setActive({ id: calendar._id });
                    }}
                  >
                    <Checkbox checked={calendar.isActive} />
                    <SidebarLabel>{calendar.calendarName}</SidebarLabel>
                    <TrashIcon
                      className="ml-auto size-5 hover:text-red-400!"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCalendar({ id: calendar._id });
                      }}
                    />
                  </SidebarItem>
                ))}
                {isCreatingNewCalendar && (
                  <SidebarItem>
                    <Input
                      placeholder="Enter new calendar name"
                      className="w-full"
                      autoFocus
                      onBlur={() => setIsCreatingNewCalendar(false)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          const name = (e.target as HTMLInputElement).value;
                          if (name) {
                            createCalendar({ name });
                            setIsCreatingNewCalendar(false);
                          }
                        }
                        if (e.key === 'Escape') {
                          setIsCreatingNewCalendar(false);
                        }
                      }}
                    />
                  </SidebarItem>
                )}
                <SidebarItem
                  onClick={() => {
                    setIsCreatingNewCalendar((prev) => !prev);
                  }}
                >
                  <PlusIcon className="size-6" />
                  <SidebarLabel>Add new calendar</SidebarLabel>
                </SidebarItem>
              </Authenticated>
              <Unauthenticated>
                {calendarsLocalStorage.map((calendar) => (
                  <SidebarItem
                    key={calendar.calendarName}
                    onClick={() => {
                      setCalendarsLocalStorage(
                        calendarsLocalStorage.map((c) => ({
                          ...c,
                          isActive: c.calendarName === calendar.calendarName,
                        }))
                      );
                    }}
                  >
                    <Checkbox checked={calendar.isActive} />
                    <SidebarLabel>{calendar.calendarName}</SidebarLabel>
                  </SidebarItem>
                ))}
                <SignUpButton mode="modal">
                  <SidebarItem>
                    <PlusIcon className="size-6" />
                    <SidebarLabel>Add new calendar</SidebarLabel>
                  </SidebarItem>
                </SignUpButton>
              </Unauthenticated>
              <AuthLoading>
                <SidebarItem>
                  <SidebarLabel>Loading...</SidebarLabel>
                </SidebarItem>
              </AuthLoading>
            </SidebarSection>
            <Authenticated>
              {sharedCalendars && sharedCalendars.length > 0 && (
                <SidebarSection>
                  <SidebarHeading>Shared With Me</SidebarHeading>
                  {sharedCalendars.map(({ calendar, owner, show }) => (
                    <SidebarItem
                      key={calendar._id}
                      onClick={() =>
                        setShareVisibility({
                          calendarId: calendar._id,
                          show: !show,
                        })
                      }
                    >
                      <CheckboxGroup>
                        <CheckboxField>
                          <Checkbox checked={show} />
                          <SidebarLabel>{calendar.calendarName}</SidebarLabel>
                          <Description className="font-normal!">
                            by {owner.name}
                          </Description>
                        </CheckboxField>
                      </CheckboxGroup>
                    </SidebarItem>
                  ))}
                </SidebarSection>
              )}
            </Authenticated>
          </SidebarBody>
        </Sidebar>

        <div>
          <Navbar className="px-2!">
            <NavbarSection>
              <NavbarItem
                current={!isFinalsSchedule}
                onClick={() => setIsFinalsSchedule(false)}
              >
                Schedule
              </NavbarItem>
              <NavbarItem
                current={isFinalsSchedule}
                onClick={() => setIsFinalsSchedule(true)}
              >
                Finals
              </NavbarItem>
            </NavbarSection>
            <NavbarSpacer />
            <NavbarSection>
              <Unauthenticated>
                <SignInButton>
                  <NavbarItem>Login / Sign up</NavbarItem>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <NavbarItem onClick={() => setDialogOpen(true)}>
                  Share
                </NavbarItem>
                <ShareModal open={isDialogOpen} onClose={setDialogOpen} />
                <UserButton />
              </Authenticated>
              <AuthLoading>
                <div className="size-7 animate-pulse bg-gray-200 rounded-full" />
              </AuthLoading>
            </NavbarSection>
          </Navbar>
          {children}
        </div>
      </div>
    </CalendarContext.Provider>
  );
}
