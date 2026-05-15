import { translateEventType } from '../../utils/eventTypeLabels';
import './CalendarGrid.scss';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const CATEGORY_CLASS = {
  VACCINE: 'calendar-grid__event--vaccine',
  DEWORMING_INTERNAL: 'calendar-grid__event--deworming',
  DEWORMING_EXTERNAL: 'calendar-grid__event--deworming',
  TREATMENT: 'calendar-grid__event--treatment',
  CHECKUP: 'calendar-grid__event--checkup',
};

function getMonthDays(year, month) {
  // Returns a flat array of 42 day cells (6 weeks x 7 days), starting Monday
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7; // Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    const day = daysInPrevMonth - firstWeekday + i + 1;
    cells.push({ date: new Date(year, month - 1, day), outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  while (cells.length < 42) {
    const offset = cells.length - (firstWeekday + daysInMonth) + 1;
    cells.push({ date: new Date(year, month + 1, offset), outside: true });
  }
  return cells;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarGrid({ year, month, events, onEventClick }) {
  const cells = getMonthDays(year, month);
  const today = new Date();

  const eventsByDay = new Map();
  for (const event of events || []) {
    const d = new Date(event.scheduledDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!eventsByDay.has(key)) {
      eventsByDay.set(key, []);
    }
    eventsByDay.get(key).push(event);
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-grid__weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="calendar-grid__days">
        {cells.map((cell, idx) => {
          const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
          const dayEvents = eventsByDay.get(key) || [];
          const visibleEvents = dayEvents.slice(0, 3);
          const extra = dayEvents.length - visibleEvents.length;
          const isToday = isSameDay(cell.date, today);

          return (
            <div
              key={idx}
              className={`calendar-grid__day ${cell.outside ? 'calendar-grid__day--outside' : ''} ${isToday ? 'calendar-grid__day--today' : ''}`}
            >
              <span className="calendar-grid__day-number">{cell.date.getDate()}</span>
              <div className="calendar-grid__events">
                {visibleEvents.map((event) => {
                  const colorClass = CATEGORY_CLASS[event.eventType?.category] || '';
                  return (
                    <button
                      key={event.id}
                      className={`calendar-grid__event ${colorClass}`}
                      onClick={() => onEventClick?.(event)}
                      title={`${event.animal?.name} - ${translateEventType(event.eventType?.name)}`}
                      type="button"
                    >
                      <span className="calendar-grid__event-text">
                        {event.animal?.name} - {translateEventType(event.eventType?.name)}
                      </span>
                    </button>
                  );
                })}
                {extra > 0 && (
                  <span className="calendar-grid__more">+{extra} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
