import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, isToday, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [todayEvents, setTodayEvents] = useState([]);
  const [pendingTodos, setPendingTodos] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    axios.get(`/calendar?timeMin=${start}&timeMax=${end}`).then(res => setTodayEvents(res.data));
    axios.get('/todos').then(res => setPendingTodos(res.data.filter(t => !t.is_completed).slice(0, 5)));
    axios.get('/notes').then(res => setRecentNotes(res.data.slice(0, 3)));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">
        {format(new Date(), 'M월 d일 (eee)', { locale: ko })} 오늘
      </h2>

      {/* 오늘 일정 */}
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-1">📅 오늘 일정</h3>
          <Link to="/calendar" className="text-xs text-indigo-500">전체 보기</Link>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-gray-400">오늘 일정이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {todayEvents.map(ev => (
              <li key={ev.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="flex-1 text-gray-700">{ev.summary}</span>
                <span className="text-gray-400 text-xs">
                  {ev.start.dateTime ? format(parseISO(ev.start.dateTime), 'HH:mm') : '종일'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 미완료 할일 */}
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-1">
            ✅ 할일
            {pendingTodos.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded-full">{pendingTodos.length}</span>
            )}
          </h3>
          <Link to="/todos" className="text-xs text-indigo-500">전체 보기</Link>
        </div>
        {pendingTodos.length === 0 ? (
          <p className="text-sm text-gray-400">미완료 할일이 없습니다 🎉</p>
        ) : (
          <ul className="space-y-2">
            {pendingTodos.map(todo => (
              <li key={todo.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-4 h-4 border-2 border-gray-300 rounded" />
                {todo.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 최근 메모 */}
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">📝 최근 메모</h3>
          <Link to="/notes" className="text-xs text-indigo-500">전체 보기</Link>
        </div>
        {recentNotes.length === 0 ? (
          <p className="text-sm text-gray-400">메모가 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {recentNotes.map(note => (
              <li key={note.id} className="text-sm">
                <p className="font-medium text-gray-700">{note.title}</p>
                {note.content && <p className="text-gray-400 text-xs truncate">{note.content}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
