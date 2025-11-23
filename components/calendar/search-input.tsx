'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/input';
import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';

interface SearchFormData {
  query: string;
}

interface SearchRecommendation {
  id: string;
  title: string;
  description?: string;
}

// Sample recommendations - in a real app, this would come from props or an API
const sampleRecommendations: SearchRecommendation[] = [
  { id: '1', title: 'Introduction to Computer Science', description: 'CS 101' },
  { id: '2', title: 'Data Structures and Algorithms', description: 'CS 201' },
  { id: '3', title: 'Web Development Fundamentals', description: 'CS 301' },
  { id: '4', title: 'Machine Learning Basics', description: 'CS 401' },
  { id: '5', title: 'Database Systems', description: 'CS 302' },
];

export default function SearchInput({
  recommendations = sampleRecommendations,
}: {
  recommendations?: SearchRecommendation[];
}) {
  const { register, handleSubmit, watch, setValue } = useForm<SearchFormData>({
    defaultValues: {
      query: '',
    },
  });

  const query = watch('query');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredRecommendations, setFilteredRecommendations] = useState<
    SearchRecommendation[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query && query.length > 0) {
      const filtered = recommendations.filter(
        (rec) =>
          rec.title.toLowerCase().includes(query.toLowerCase()) ||
          rec.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRecommendations(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredRecommendations(recommendations.slice(0, 5));
      setIsOpen(false);
    }
  }, [query, recommendations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const onSubmit = (data: SearchFormData) => {
    console.log('Search query:', data.query);
    setIsOpen(false);
  };

  const handleSelectRecommendation = (recommendation: SearchRecommendation) => {
    setValue('query', recommendation.title);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (filteredRecommendations.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          type="search"
          placeholder="Search for classes"
          connectedBottom={isOpen && filteredRecommendations.length > 0}
          {...register('query')}
          ref={(e) => {
            register('query').ref(e);
            inputRef.current = e;
          }}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
      </form>

      {isOpen && filteredRecommendations.length > 0 && (
        <div
          className={clsx(
            // Position directly below input with no gap - connects visually
            'absolute top-full left-0 right-0 z-50',
            // Base styles matching ComboboxOptions
            'isolate scroll-py-1 rounded-b-xl rounded-t-none p-1 select-none empty:invisible',
            // Invisible border for forced-colors mode
            'outline outline-transparent focus:outline-hidden',
            // Handle scrolling
            'overflow-y-auto overscroll-contain max-h-64',
            // Popover background matching design system
            'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
            // Blue border on sides and bottom only (no top to avoid double ring with input)
            'border-l-2 border-r-2 border-b-2 border-t-0 border-blue-500',
            // Shadow
            'shadow-lg'
          )}
        >
          {filteredRecommendations.map((recommendation) => (
            <button
              key={recommendation.id}
              type="button"
              onClick={() => handleSelectRecommendation(recommendation)}
              className={clsx(
                // Basic layout matching ComboboxOption
                'group/option grid w-full cursor-default grid-cols-[1fr] items-baseline gap-x-2 rounded-lg py-2.5 pr-2 pl-3.5 sm:py-1.5 sm:pr-2 sm:pl-3',
                // Typography
                'text-left text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
                // Hover and focus states matching ComboboxOption
                'outline-hidden hover:bg-blue-500 hover:text-white focus:outline-hidden focus:bg-blue-500 focus:text-white',
                // Forced colors mode
                'forced-color-adjust-none forced-colors:hover:bg-[Highlight] forced-colors:hover:text-[HighlightText] forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]',
                // Disabled
                'disabled:opacity-50'
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{recommendation.title}</span>
                {recommendation.description && (
                  <span className="text-sm text-zinc-500 group-hover/option:text-white/80 dark:text-zinc-400 sm:text-xs">
                    {recommendation.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
