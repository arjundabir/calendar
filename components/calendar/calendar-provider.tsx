'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '../navbar';
import {
  Authenticated,
  AuthLoading,
  type Preloaded,
  Unauthenticated,
  useMutation,
  usePreloadedQuery,
  useQuery,
} from 'convex/react';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { TrashIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/solid';
import type { paths } from '@/types/anteater-api-types';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Input } from '../input';
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
import ShareModal from '../share-modal';
import {
  Sidebar,
  SidebarBody,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '../sidebar';
import { Checkbox, CheckboxField, CheckboxGroup } from '../checkbox';
import { Description } from '../fieldset';

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
  const [calendarEvents, setCalendarEvents] = useLocalStorage<
    CalendarContextType['calendarEvents']
  >('calendar', []);
  const [calendarsLocalStorage, setCalendarsLocalStorage] = useLocalStorage<
    LocalCalendar[]
  >('calendars', []);
  const [isFinalsSchedule, setIsFinalsSchedule] = useState<boolean>(false);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  function removeCalendarEvent(sectionCode: string): void {
    setCalendarEvents(
      calendarEvents.filter((event) => event.sectionCode !== sectionCode)
    );
  }
  const { isAuthenticated } = useStoreUserEffect();
  const calendars = usePreloadedQuery(preloadedTerms);
  const activeTerm = isAuthenticated
    ? calendars?.find((calendar) => calendar.isActive)
    : calendarsLocalStorage.find((calendar) => calendar.isActive);
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
