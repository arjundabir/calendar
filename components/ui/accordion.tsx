'use client';

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';

export function AccordionGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="control"
      {...props}
      className={clsx(
        className,
        // Basic groups
        'space-y-0'
      )}
    />
  );
}

export function Accordion({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DisclosureProps,
  'as' | 'className'
>) {
  return (
    <Headless.Disclosure
      as="div"
      {...props}
      className={clsx(
        className,
        // Base styles
        'group isolate border-b border-zinc-950/10 dark:border-white/10 last:border-b-0',
        // Focus
        'focus-within:outline-hidden',
        // Forced colors mode
        'forced-colors:outline'
      )}
    />
  );
}

export function AccordionButton({
  className,
  children,
  ...props
}: { className?: string } & Omit<
  Headless.DisclosureButtonProps,
  'as' | 'className'
>) {
  return (
    <Headless.DisclosureButton
      {...props}
      className={clsx(
        className,
        // Base layout
        'flex w-full items-center gap-x-4 px-4 py-3 text-left sm:px-3 sm:py-2.5',
        // Text styles
        'text-base/6 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white',
        // Hover state
        'data-hover:bg-zinc-950/2.5 dark:data-hover:bg-white/5',
        // Focus state
        'focus:outline-hidden',
        // Disabled state
        'data-disabled:opacity-50',
        // Forced colors mode
        'forced-colors:data-hover:bg-[Highlight] forced-colors:data-hover:text-[HighlightText]'
      )}
    >
      {typeof children === 'function' ? (
        (bag) => (
          <>
            <div className="flex flex-1 items-center justify-between gap-x-4">
              {children(bag)}
            </div>
            <AccordionIcon />
          </>
        )
      ) : (
        <>
          <div className="flex flex-1 items-center justify-between gap-x-4">
            {children}
          </div>
          <AccordionIcon />
        </>
      )}
    </Headless.DisclosureButton>
  );
}

export function AccordionPanel({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DisclosurePanelProps,
  'as' | 'className'
>) {
  return (
    <Headless.DisclosurePanel
      {...props}
      transition
      className={clsx(
        className,
        // Base styles
        'px-4 pb-4 pt-0 sm:px-3 sm:pb-3',
        // Transitions
        'transition duration-200 data-closed:opacity-0 data-leave:ease-in data-enter:ease-out'
      )}
    />
  );
}

export function AccordionTitle({
  className,
  ...props
}: { className?: string } & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span data-slot="label" {...props} className={clsx(className, 'flex-1')} />
  );
}

export function AccordionIcon({
  className,
  ...props
}: { className?: string } & React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      {...props}
      className={clsx(
        className,
        'size-5 shrink-0 text-zinc-500 transition-transform duration-200 group-data-open:rotate-180 sm:size-4 dark:text-zinc-400'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
