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
type Term = Doc<'terms'>;
export interface CalendarEvents extends WebSocSection {
  deptCode: WebSocCourse['deptCode'];
  courseNumber: WebSocCourse['courseNumber'];
  deptName: WebSocDepartment['deptName'];
  termId: string;
}

type CalendarContextType = {
  calendarEvents: CalendarEvents[] | [];
  setCalendarEvents: (events: CalendarEvents[] | []) => void;
  removeCalendarEvent: (sectionCode: string) => void;
  activeTerm: Doc<'terms'> | undefined;
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
  preloadedTerms: Preloaded<typeof api.term.getTerms>;
}) {
  const [calendarEvents, setCalendarEvents] = useLocalStorage<
    CalendarContextType['calendarEvents']
  >('calendar', []);
  const [termsLocalStorage, setTermsLocalStorage] = useLocalStorage<Term[]>(
    'terms',
    []
  );
  const [isFinalsSchedule, setIsFinalsSchedule] = useState<boolean>(false);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  function removeCalendarEvent(sectionCode: string): void {
    setCalendarEvents(
      calendarEvents.filter((event) => event.sectionCode !== sectionCode)
    );
  }
  const { isAuthenticated } = useStoreUserEffect();
  const terms = usePreloadedQuery(preloadedTerms);
  const activeTerm = isAuthenticated
    ? terms?.find((term) => term.isActive)
    : termsLocalStorage.find((term) => term.isActive);
  const [isCreatingNewCalendar, setIsCreatingNewCalendar] =
    useState<boolean>(false);
  const sharedTerms = useQuery(api.term.getTermsSharedWithMe);
  const setShareVisibility = useMutation(api.share.setShareVisibility);

  const deleteTerm = useMutation(api.term.deleteTerm).withOptimisticUpdate(
    (localStore, args) => {
      const terms = localStore.getQuery(api.term.getTerms);
      if (!terms) return;

      const updatedTerms = terms.filter((term) => term._id !== args.id);
      return updatedTerms;
    }
  );

  const createTerm = useMutation(api.term.createTerm).withOptimisticUpdate(
    (localStore, args) => {
      const terms = localStore.getQuery(api.term.getTerms);
      if (!terms) return;

      const updatedTerms = terms.map((term) => ({
        ...term,
        isActive: false,
      }));

      updatedTerms.push({
        _id: `temp_${args.name}` as (typeof terms)[0]['_id'],
        _creationTime: 0,
        userId: { __tableName: 'users' } as (typeof terms)[0]['userId'],
        termName: args.name,
        isActive: true,
      });

      localStore.setQuery(api.term.getTerms, {}, updatedTerms);
    }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const termName = `${latestTerm.quarter} ${latestTerm.year}`;
      const termAlreadyExists = termsLocalStorage.some(
        (t) => t.termName === termName
      );
      if (!termAlreadyExists) {
        const newTerm: Term = {
          _id: `local_${Date.now()}_${termName}` as Doc<'terms'>['_id'],
          _creationTime: Date.now(),
          userId: 'local' as Id<'users'>,
          termName,
          isActive: true,
        };
        setTermsLocalStorage([
          ...termsLocalStorage.map((term) => ({ ...term, isActive: false })),
          newTerm,
        ]);
      }
      return;
    }

    if (!terms) return;

    const termName = `${latestTerm.quarter} ${latestTerm.year}`;
    const termAlreadyExists = terms?.some((t) => t.termName === termName);
    if (!termAlreadyExists) {
      createTerm({ name: termName });
    }
  }, [
    createTerm,
    isAuthenticated,
    latestTerm.year,
    latestTerm.quarter,
    terms,
    termsLocalStorage,
    setTermsLocalStorage,
  ]);

  const setActive = useMutation(api.term.setActiveTerm).withOptimisticUpdate(
    (localStore, args) => {
      const terms = localStore.getQuery(api.term.getTerms);
      if (!terms) return;

      const updatedTerms = terms.map((term) => ({
        ...term,
        isActive: term._id === args.id,
      }));
      localStore.setQuery(api.term.getTerms, {}, updatedTerms);
    }
  );

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
                {terms?.map((term) => (
                  <SidebarItem
                    key={term._id}
                    onClick={() => {
                      setActive({ id: term._id });
                    }}
                  >
                    <Checkbox checked={term.isActive} />
                    <SidebarLabel>{term.termName}</SidebarLabel>
                    <TrashIcon
                      className="ml-auto size-5 hover:text-red-400!"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTerm({ id: term._id });
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
                            createTerm({ name });
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
                {termsLocalStorage.map((term) => (
                  <SidebarItem
                    key={term._id}
                    onClick={() => {
                      setTermsLocalStorage(
                        termsLocalStorage.map((t) => ({
                          ...t,
                          isActive: t._id === term._id,
                        }))
                      );
                    }}
                  >
                    <Checkbox checked={term.isActive} />
                    <SidebarLabel>{term.termName}</SidebarLabel>
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
              {sharedTerms && sharedTerms.length > 0 && (
                <SidebarSection>
                  <SidebarHeading>Shared With Me</SidebarHeading>
                  {sharedTerms.map(({ term, owner, show }) => (
                    <SidebarItem
                      key={term._id}
                      onClick={() =>
                        setShareVisibility({ termId: term._id, show: !show })
                      }
                    >
                      <CheckboxGroup>
                        <CheckboxField>
                          <Checkbox checked={show} />
                          <SidebarLabel>{term.termName}</SidebarLabel>
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
