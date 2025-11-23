'use client';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { useState } from 'react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CalendarTabs() {
  const [tabs, setTabs] = useState([
    { name: 'Search', href: 'search', current: true },
    { name: 'Added', href: 'added', current: false },
    //TODO: @arjundabir add this { name: 'Map', href: 'map', current: true },
  ]);
  // Fix: refactor tab handling so both select and links control and reflect active tab state properly
  function handleTabChange(selectedTabName: string) {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        current: tab.name === selectedTabName,
      }))
    );
  }

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
                  'grow px-1 py-3 text-center text-sm font-medium cursor-pointer'
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
