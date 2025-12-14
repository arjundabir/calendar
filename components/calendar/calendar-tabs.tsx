'use client';
import { useTabContext } from './tab-context';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export default function CalendarTabs() {
	const { tabs, handleTabChange } = useTabContext();

	return (
		<div>
			<div className="block">
				<div className="border-b border-gray-200">
					<nav aria-label="Tabs" className="flex">
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab.name}
								onClick={(e) => {
									e.preventDefault();
									handleTabChange(tab.name);
								}}
								aria-current={tab.current ? 'page' : undefined}
								className={classNames(
									tab.current
										? 'text-black shadow-[inset_0_-2px_0_0_var(--color-black)]'
										: 'text-sm/6 text-gray-500 shadow-[inset_0_-2px_0_0_transparent] hover:shadow-[inset_0_-2px_0_0_rgb(209,213,219)] hover:text-gray-700',
									'grow px-1 py-3 text-center text-sm font-medium cursor-pointer',
								)}
							>
								{tab.name}
							</button>
						))}
					</nav>
				</div>
			</div>
		</div>
	);
}
