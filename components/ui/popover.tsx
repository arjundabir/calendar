'use client';

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';

export function Popover(props: Headless.PopoverProps) {
	return <Headless.Popover {...props} />;
}

export function PopoverButton<T extends React.ElementType = 'button'>({
	className,
	...props
}: { className?: string } & Omit<Headless.PopoverButtonProps<T>, 'className'>) {
	return (
		<Headless.PopoverButton
			{...props}
			className={clsx(
				className,
				'focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
			)}
		/>
	);
}

export function PopoverPanel({
	anchor = 'bottom',
	className,
	...props
}: { className?: string } & Omit<
	Headless.PopoverPanelProps,
	'as' | 'className'
>) {
	return (
		<Headless.PopoverPanel
			{...props}
			transition
			anchor={anchor}
			className={clsx(
				className,
				// Anchor positioning
				'[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)]',
				// Base styles
				'isolate w-max rounded-xl p-3',
				// Invisible border that is only visible in `forced-colors` mode for accessibility purposes
				'outline outline-transparent focus:outline-hidden',
				// Handle scrolling when panel won't fit in viewport
				'overflow-y-auto',
				// Glass morphism background
				'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
				// Shadows
				'shadow-lg ring-1 ring-zinc-950/10 dark:ring-white/10 dark:ring-inset',
				// Typography
				'text-sm/6',
				// Transitions
				'transition duration-200 ease-in-out data-closed:-translate-y-1 data-closed:opacity-0',
			)}
		/>
	);
}

export function PopoverSection({
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return <div {...props} className={clsx(className, 'p-3')} />;
}

export function PopoverDivider({
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			{...props}
			className={clsx(
				className,
				'mx-3 my-1 h-px border-0 bg-zinc-950/5 dark:bg-white/10',
			)}
		/>
	);
}

export function PopoverLabel({
	className,
	...props
}: React.ComponentPropsWithoutRef<'p'>) {
	return (
		<p
			{...props}
			className={clsx(className, 'font-semibold text-zinc-950 dark:text-white')}
		/>
	);
}

export function PopoverDescription({
	className,
	...props
}: React.ComponentPropsWithoutRef<'p'>) {
	return (
		<p
			{...props}
			className={clsx(className, 'text-zinc-500 dark:text-zinc-400')}
		/>
	);
}
