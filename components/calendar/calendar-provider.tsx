'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
  Navbar,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from '../navbar';
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import {
  CheckIcon,
  ChevronDownIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '../dropdown';
import { paths } from '@/types/anteater-api-types';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Input } from '../input';
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';

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

export interface CalendarEvents extends WebSocSection {
  deptCode: WebSocCourse['deptCode'];
  courseNumber: WebSocCourse['courseNumber'];
  deptName: WebSocDepartment['deptName'];
}

type CalendarContextType = {
  calendarEvents: CalendarEvents[] | [];
  setCalendarEvents: (events: CalendarEvents[] | []) => void;
  removeCalendarEvent: (sectionCode: string) => void;
  activeTerm: Doc<'terms'> | undefined;
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
}: {
  children: ReactNode;
  latestTerm: Calendar;
}) {
  const [calendarEvents, setCalendarEvents] = useLocalStorage<
    CalendarContextType['calendarEvents']
  >('calendar', []);

  function removeCalendarEvent(sectionCode: string): void {
    setCalendarEvents(
      calendarEvents.filter((event) => event.sectionCode !== sectionCode)
    );
  }
  const terms = useQuery(api.term.getTerms);
  const activeTerm = terms?.find((term) => term.isActive);
  const [isCreatingNewCalendar, setIsCreatingNewCalendar] =
    useState<boolean>(false);
  const { isAuthenticated } = useStoreUserEffect();

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
        userId: '',
        termName: args.name,
        isActive: true,
      });

      localStore.setQuery(api.term.getTerms, {}, updatedTerms);
    }
  );

  useEffect(() => {
    if (!terms) return;
    if (!isAuthenticated) return;

    const termName = `${latestTerm.quarter} ${latestTerm.year}`;
    const termAlreadyExists = terms?.some((t) => t.termName === termName);
    if (!termAlreadyExists) {
      createTerm({ name: termName });
    }
  }, [isAuthenticated, latestTerm.year, latestTerm.quarter, terms]);

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
      }}
    >
      <Navbar className="px-2!">
        <Unauthenticated>
          <Dropdown>
            <DropdownButton as={NavbarItem}>
              {latestTerm.quarter} {latestTerm.year}
              <ChevronDownIcon />
            </DropdownButton>
            <DropdownMenu>
              <SignUpButton mode="modal">
                <DropdownItem>New Calendar&hellip;</DropdownItem>
              </SignUpButton>
            </DropdownMenu>
          </Dropdown>
        </Unauthenticated>
        <Authenticated>
          <Dropdown>
            {({ open }) => {
              if (isCreatingNewCalendar && open)
                setIsCreatingNewCalendar(false);
              return (
                <>
                  <DropdownButton as={NavbarItem}>
                    <NavbarLabel>{activeTerm?.termName}</NavbarLabel>
                    <ChevronDownIcon />
                  </DropdownButton>
                  <DropdownMenu className="min-w-64" anchor="bottom start">
                    <DropdownSection>
                      {terms?.map((term) => (
                        <DropdownItem
                          key={term._id}
                          value={term.termName}
                          onClick={() => {
                            setActive({ id: term._id });
                          }}
                        >
                          <DropdownLabel>{term.termName}</DropdownLabel>
                          {term.isActive && <CheckIcon />}
                          <TrashIcon
                            className="col-start-6! row-start-1! hover:text-red-400!"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTerm({ id: term._id });
                            }}
                          />
                        </DropdownItem>
                      ))}
                      {isCreatingNewCalendar && (
                        <Input
                          placeholder="Enter new calendar name"
                          className="col-span-full"
                          autoFocus
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const name = (e.target as HTMLInputElement).value;
                              if (name) {
                                createTerm({ name });
                                setIsCreatingNewCalendar(false);
                              }
                            }
                          }}
                        />
                      )}
                    </DropdownSection>
                    <DropdownDivider />
                    <DropdownSection>
                      <DropdownItem
                        onClick={(e) => {
                          e.preventDefault();
                          setIsCreatingNewCalendar((prev) => !prev);
                        }}
                      >
                        New calendar&hellip;
                      </DropdownItem>
                    </DropdownSection>
                  </DropdownMenu>
                </>
              );
            }}
          </Dropdown>
        </Authenticated>
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
