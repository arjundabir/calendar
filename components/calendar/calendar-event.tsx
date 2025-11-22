import { ReactNode } from 'react';

function CalendarList({ children }: { children: ReactNode }) {
  return (
    <ol
      style={{
        gridTemplateRows: '1.75rem repeat(192, minmax(0, 1fr)) auto',
      }}
      className="col-start-1 col-end-2 row-start-1 grid grid-cols-5"
    >
      {children}
    </ol>
  );
}
function CalendarEvent() {
  return <div></div>;
}

export { CalendarList, CalendarEvent };
