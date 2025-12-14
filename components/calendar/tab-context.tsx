'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Tab = {
	name: string;
	href: string;
	current: boolean;
};

type TabContextType = {
	tabs: Tab[];
	setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
	handleTabChange: (selectedTabName: string) => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export function useTabContext() {
	const context = useContext(TabContext);
	if (context === undefined) {
		throw new Error('useTabContext must be used within a TabProvider');
	}
	return context;
}

export function TabProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>([
		{ name: 'Search', href: 'search', current: true },
		{ name: 'Added', href: 'added', current: false },
		//TODO: @arjundabir add this { name: 'Map', href: 'map', current: true },
	]);

	function handleTabChange(selectedTabName: string) {
		setTabs((prevTabs) =>
			prevTabs.map((tab) => ({
				...tab,
				current: tab.name === selectedTabName,
			})),
		);
	}

	return (
		<TabContext.Provider value={{ tabs, setTabs, handleTabChange }}>
			{children}
		</TabContext.Provider>
	);
}
