import type { CalendarEvents } from '@/components/calendar/calendar-provider';
import type { ReactElement } from 'react';
import { CalendarEvent } from '@/components/calendar/calendar-event';

// Helper function to map day strings to CalendarEvent dayOfWeek format
function parseDays(days: string): Array<'M' | 'T' | 'W' | 'Th' | 'F'> {
  const result: Array<'M' | 'T' | 'W' | 'Th' | 'F'> = [];

  // Handle two-letter day codes first (Tu, Th)
  if (days.includes('Tu')) {
    result.push('T');
    days = days.replace(/Tu/g, '');
  }
  if (days.includes('Th')) {
    result.push('Th');
    days = days.replace(/Th/g, '');
  }

  // Handle single letter day codes
  const dayMap: Record<string, 'M' | 'T' | 'W' | 'Th' | 'F'> = {
    M: 'M',
    T: 'T',
    W: 'W',
    F: 'F',
  };

  for (const char of days) {
    if (dayMap[char] && !result.includes(dayMap[char])) {
      result.push(dayMap[char]);
    }
  }

  return result;
}

// Helper function to round minutes to nearest 10
function roundToNearest10(minute: number): number {
  return Math.round(minute / 10) * 10;
}

// Helper function to get a color based on deptCode (for consistent coloring)
function getColorForDept(
  sectionCode: string
):
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone' {
  const colors: Array<
    | 'red'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'lime'
    | 'green'
    | 'emerald'
    | 'teal'
    | 'cyan'
    | 'sky'
    | 'blue'
    | 'indigo'
    | 'violet'
    | 'purple'
    | 'fuchsia'
    | 'pink'
    | 'rose'
    | 'slate'
    | 'gray'
    | 'zinc'
    | 'neutral'
    | 'stone'
  > = [
    'blue',
    'green',
    'purple',
    'pink',
    'indigo',
    'teal',
    'orange',
    'amber',
    'violet',
    'cyan',
    'emerald',
    'rose',
  ];

  // Simple hash function to consistently assign colors
  let hash = 0;
  for (let i = 0; i < sectionCode.length; i++) {
    hash = sectionCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Helper function to convert time to minutes since 7AM (start of calendar)
function timeToMinutes(hour: number, minute: number): number {
  return (hour - 7) * 60 + minute;
}

// Helper function to check if two time ranges overlap
function eventsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

// Transform calendarEvents into CalendarEvent components
function transformCalendarEvents(calendarEvents: CalendarEvents[]) {
  // First pass: collect all event data
  type EventData = {
    dayOfWeek: 'M' | 'T' | 'W' | 'Th' | 'F';
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
    color: ReturnType<typeof getColorForDept>;
    deptCode: string;
    courseNumber: string;
    sectionType: string;
    sectionCode: string;
    finalExam: CalendarEvents['finalExam'];
    locations: string[];
    instructors: string[];
    key: string;
  };

  const eventDataList: EventData[] = [];

  calendarEvents.forEach((calendarEvent, eventIndex) => {
    const color = getColorForDept(calendarEvent.sectionCode);

    calendarEvent.meetings.forEach((meeting, meetingIndex) => {
      // Skip TBA meetings
      if (meeting.timeIsTBA) {
        return;
      }

      // Parse days and create an event for each day
      const days = parseDays(meeting.days);

      // Round minutes to nearest 10 (CalendarEvent requirement)
      const startMinute = roundToNearest10(meeting.startTime.minute);
      const endMinute = roundToNearest10(meeting.endTime.minute);

      // Adjust hour if rounding minutes caused overflow
      let startHour = meeting.startTime.hour;
      let endHour = meeting.endTime.hour;

      if (startMinute >= 60) {
        startHour += 1;
      }
      if (endMinute >= 60) {
        endHour += 1;
      }

      // Ensure hours are within valid range (7-23)
      startHour = Math.max(7, Math.min(23, startHour));
      endHour = Math.max(7, Math.min(23, endHour));

      days.forEach((dayOfWeek) => {
        eventDataList.push({
          dayOfWeek,
          startTime: { hour: startHour, minute: startMinute % 60 },
          endTime: { hour: endHour, minute: endMinute % 60 },
          color,
          deptCode: calendarEvent.deptCode,
          courseNumber: calendarEvent.courseNumber,
          sectionType: calendarEvent.sectionType,
          sectionCode: calendarEvent.sectionCode,
          finalExam: calendarEvent.finalExam,
          locations: meeting.bldg,
          instructors: calendarEvent.instructors,
          key: `${eventIndex}-${meetingIndex}-${dayOfWeek}`,
        });
      });
    });
  });

  // Second pass: calculate overlaps for each event
  const events: ReactElement[] = eventDataList.map((eventData) => {
    // Convert times to minutes for comparison
    const startMinutes = timeToMinutes(
      eventData.startTime.hour,
      eventData.startTime.minute
    );
    const endMinutes = timeToMinutes(
      eventData.endTime.hour,
      eventData.endTime.minute
    );

    // Find all overlapping events on the same day
    const overlappingEvents = eventDataList.filter((otherEvent) => {
      if (otherEvent.dayOfWeek !== eventData.dayOfWeek) {
        return false;
      }
      const otherStartMinutes = timeToMinutes(
        otherEvent.startTime.hour,
        otherEvent.startTime.minute
      );
      const otherEndMinutes = timeToMinutes(
        otherEvent.endTime.hour,
        otherEvent.endTime.minute
      );
      return eventsOverlap(
        startMinutes,
        endMinutes,
        otherStartMinutes,
        otherEndMinutes
      );
    });

    // Calculate overlap count and index
    const overlapCount = overlappingEvents.length;
    const overlapIndex = overlappingEvents.findIndex(
      (e) => e.key === eventData.key
    );

    return (
      <CalendarEvent
        key={eventData.key}
        dayOfWeek={eventData.dayOfWeek}
        startTime={eventData.startTime}
        endTime={eventData.endTime}
        color={eventData.color}
        deptCode={eventData.deptCode}
        courseNumber={eventData.courseNumber}
        sectionType={eventData.sectionType}
        sectionCode={eventData.sectionCode}
        finalExam={eventData.finalExam}
        locations={eventData.locations}
        instructors={eventData.instructors}
        overlapCount={overlapCount}
        overlapIndex={overlapIndex}
      />
    );
  });

  return events;
}

export { parseDays, getColorForDept, transformCalendarEvents };
