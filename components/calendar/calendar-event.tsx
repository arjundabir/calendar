import type { ReactNode } from 'react';
import { z } from 'zod';
import type { CalendarEvents } from './calendar-provider';
import { Button } from '../button';
import {
  Popover,
  PopoverButton,
  PopoverDivider,
  PopoverPanel,
} from '../popover';
import {
  AcademicCapIcon,
  ClipboardIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

function CalendarList({ children }: { children: ReactNode }) {
  return (
    <ol
      style={{
        gridTemplateRows: 'repeat(192, 1fr) auto',
      }}
      className="col-start-1 col-end-2 row-start-1 grid grid-cols-5"
    >
      {children}
    </ol>
  );
}
const hourSchema = z.number().min(7).max(23);
const minuteSchema = z
  .number()
  .min(0)
  .max(60)
  .refine((val) => val % 10 === 0);
type TimeType = {
  hour: z.infer<typeof hourSchema>;
  minute: z.infer<typeof minuteSchema>;
};
type TailwindColors =
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
  | 'stone';
const colorClasses: Record<
  TailwindColors,
  {
    bg: string;
    hover: string;
    title: string;
    time: string;
    timeHover: string;
  }
> = {
  red: {
    bg: 'bg-red-50',
    hover: 'hover:bg-red-100',
    title: 'text-red-700',
    time: 'text-red-500',
    timeHover: 'group-hover:text-red-700',
  },
  orange: {
    bg: 'bg-orange-50',
    hover: 'hover:bg-orange-100',
    title: 'text-orange-700',
    time: 'text-orange-500',
    timeHover: 'group-hover:text-orange-700',
  },
  amber: {
    bg: 'bg-amber-50',
    hover: 'hover:bg-amber-100',
    title: 'text-amber-700',
    time: 'text-amber-500',
    timeHover: 'group-hover:text-amber-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    hover: 'hover:bg-yellow-100',
    title: 'text-yellow-700',
    time: 'text-yellow-500',
    timeHover: 'group-hover:text-yellow-700',
  },
  lime: {
    bg: 'bg-lime-50',
    hover: 'hover:bg-lime-100',
    title: 'text-lime-700',
    time: 'text-lime-500',
    timeHover: 'group-hover:text-lime-700',
  },
  green: {
    bg: 'bg-green-50',
    hover: 'hover:bg-green-100',
    title: 'text-green-700',
    time: 'text-green-500',
    timeHover: 'group-hover:text-green-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    hover: 'hover:bg-emerald-100',
    title: 'text-emerald-700',
    time: 'text-emerald-500',
    timeHover: 'group-hover:text-emerald-700',
  },
  teal: {
    bg: 'bg-teal-50',
    hover: 'hover:bg-teal-100',
    title: 'text-teal-700',
    time: 'text-teal-500',
    timeHover: 'group-hover:text-teal-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    hover: 'hover:bg-cyan-100',
    title: 'text-cyan-700',
    time: 'text-cyan-500',
    timeHover: 'group-hover:text-cyan-700',
  },
  sky: {
    bg: 'bg-sky-50',
    hover: 'hover:bg-sky-100',
    title: 'text-sky-700',
    time: 'text-sky-500',
    timeHover: 'group-hover:text-sky-700',
  },
  blue: {
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    title: 'text-blue-700',
    time: 'text-blue-500',
    timeHover: 'group-hover:text-blue-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    hover: 'hover:bg-indigo-100',
    title: 'text-indigo-700',
    time: 'text-indigo-500',
    timeHover: 'group-hover:text-indigo-700',
  },
  violet: {
    bg: 'bg-violet-50',
    hover: 'hover:bg-violet-100',
    title: 'text-violet-700',
    time: 'text-violet-500',
    timeHover: 'group-hover:text-violet-700',
  },
  purple: {
    bg: 'bg-purple-50',
    hover: 'hover:bg-purple-100',
    title: 'text-purple-700',
    time: 'text-purple-500',
    timeHover: 'group-hover:text-purple-700',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50',
    hover: 'hover:bg-fuchsia-100',
    title: 'text-fuchsia-700',
    time: 'text-fuchsia-500',
    timeHover: 'group-hover:text-fuchsia-700',
  },
  pink: {
    bg: 'bg-pink-50',
    hover: 'hover:bg-pink-100',
    title: 'text-pink-700',
    time: 'text-pink-500',
    timeHover: 'group-hover:text-pink-700',
  },
  rose: {
    bg: 'bg-rose-50',
    hover: 'hover:bg-rose-100',
    title: 'text-rose-700',
    time: 'text-rose-500',
    timeHover: 'group-hover:text-rose-700',
  },
  slate: {
    bg: 'bg-slate-50',
    hover: 'hover:bg-slate-100',
    title: 'text-slate-700',
    time: 'text-slate-500',
    timeHover: 'group-hover:text-slate-700',
  },
  gray: {
    bg: 'bg-gray-100',
    hover: 'hover:bg-gray-200',
    title: 'text-gray-700',
    time: 'text-gray-500',
    timeHover: 'group-hover:text-gray-700',
  },
  zinc: {
    bg: 'bg-zinc-50',
    hover: 'hover:bg-zinc-100',
    title: 'text-zinc-700',
    time: 'text-zinc-500',
    timeHover: 'group-hover:text-zinc-700',
  },
  neutral: {
    bg: 'bg-neutral-50',
    hover: 'hover:bg-neutral-100',
    title: 'text-neutral-700',
    time: 'text-neutral-500',
    timeHover: 'group-hover:text-neutral-700',
  },
  stone: {
    bg: 'bg-stone-50',
    hover: 'hover:bg-stone-100',
    title: 'text-stone-700',
    time: 'text-stone-500',
    timeHover: 'group-hover:text-stone-700',
  },
};
interface CalendarEventType {
  dayOfWeek: 'M' | 'T' | 'W' | 'Th' | 'F';
  startTime: TimeType;
  endTime: TimeType;
  color: TailwindColors;
  deptCode: string;
  courseNumber: string;
  sectionType: string;
  sectionCode: string;
  finalExam: CalendarEvents['finalExam'];
  locations: string[];
  instructors: string[];
  overlapCount: number;
  overlapIndex: number;
}

function CalendarEvent({
  dayOfWeek,
  startTime,
  endTime,
  color,
  deptCode,
  courseNumber,
  sectionType,
  sectionCode,
  finalExam,
  locations,
  instructors,
  overlapCount,
  overlapIndex,
}: CalendarEventType) {
  // Validate startTime and endTime using hourSchema and minuteSchema
  hourSchema.parse(startTime.hour);
  minuteSchema.parse(startTime.minute);
  hourSchema.parse(endTime.hour);
  minuteSchema.parse(endTime.minute);

  const dayOfWeekId = {
    M: 1,
    T: 2,
    W: 3,
    Th: 4,
    F: 5,
  };
  const formatTime = (time: number) => (time % 12 === 0 ? 12 : time % 12);
  const meridiem = (hour: number) => (hour >= 12 ? 'PM' : 'AM');
  const formatDayOfWeek = (day: CalendarEventType['dayOfWeek']) => {
    switch (day) {
      case 'M':
        return 'Monday';
      case 'T':
        return 'Tuesday';
      case 'W':
        return 'Wednesday';
      case 'Th':
        return 'Thursday';
      case 'F':
        return 'Friday';
      default:
        return '';
    }
  };

  const timeToRow = (time: TimeType): number => {
    const totalMinutes = (time.hour - 7) * 60 + time.minute;
    return Math.floor(totalMinutes / 5) + 1;
  };

  // Pre-written class strings so Tailwind can detect them during static analysis

  const colors = colorClasses[color];

  return (
    <li
      style={{
        gridRowStart: `${timeToRow(startTime)}`,
        gridRowEnd: `${timeToRow(endTime)}`,
      }}
      className={`relative flex col-start-${dayOfWeekId[dayOfWeek]} pointer-none:`}
    >
      <Popover>
        <PopoverButton
          style={{
            width: `calc(100% / ${overlapCount})`,
            left: `calc(${overlapIndex} * 100% / ${overlapCount})`,
          }}
          className={`pointer-auto text-left group inset-px absolute flex flex-col rounded ${colors.bg} p-1! text-xs/3.5! ${colors.hover} overflow-clip`}
        >
          <p className={`font-semibold ${colors.title}`}>
            {deptCode} {courseNumber} {sectionType}
          </p>
          <p className={`${colors.time} ${colors.timeHover}`}>
            <time className=" ">
              {formatTime(startTime.hour)}:
              {startTime.minute.toString().padStart(2, '0')}{' '}
              {meridiem(startTime.hour)}
            </time>
            ,&nbsp;<span>{locations?.map((location) => location)}</span>
          </p>
        </PopoverButton>
        <PopoverPanel anchor="left" className="w-96!">
          <div className="flex justify-end">
            <Button plain>
              <TrashIcon className="size-4" />
            </Button>
          </div>
          <div className="px-2">
            <div>
              <h2 className="text-2xl font-medium">
                {deptCode} {courseNumber} {sectionType}
              </h2>
              <p className="text-sm">
                {formatDayOfWeek(dayOfWeek)}, {startTime.hour}:
                {startTime.minute.toString().padStart(2, '0')}{' '}
                {meridiem(startTime.hour)} - {endTime.hour}:
                {endTime.minute.toString().padStart(2, '0')}{' '}
                {meridiem(endTime.hour)}
              </p>
            </div>
          </div>
          <div className="my-4 flex flex-col gap-y-1">
            <Button plain className="justify-start">
              <MapPinIcon /> {locations?.map((location) => location)}
            </Button>
            <Button plain className="justify-start">
              <ClipboardIcon />
              {sectionCode}
            </Button>
            <Button plain className="justify-start">
              <AcademicCapIcon /> {instructors.join(', ')}
            </Button>
          </div>
          <PopoverDivider />
          <h4 className="px-2 text-lg font-medium">Final</h4>
          <Button plain className="w-full justify-start font-normal!">
            <PencilIcon />
            {finalExam?.examStatus === 'SCHEDULED_FINAL'
              ? `${finalExam.dayOfWeek}, ${format(
                  new Date(2000, finalExam.month, 1),
                  'LLLL'
                )} ${finalExam.day} ${
                  finalExam.startTime.hour
                }:${finalExam.startTime.minute.toString().padStart(2, '0')} - ${
                  finalExam.endTime.hour
                }:${finalExam.endTime.minute
                  .toString()
                  .padStart(2, '0')} ${meridiem(
                  finalExam.endTime.hour
                )} at ${finalExam.bldg.join(', ')}`
              : finalExam?.examStatus.split('_')[0]}
          </Button>
        </PopoverPanel>
      </Popover>
    </li>
  );
}

export { CalendarList, CalendarEvent };
