import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', startDateTime: '', endDateTime: '' });

  const loadEvents = (date) => {
    const start = startOfMonth(date).toISOString();
    const end = endOfMonth(date).toISOString();
    axios.get(`/calendar?timeMin=${start}&timeMax=${end}`).then(res => setEvents(res.data));
  };

  useEffect(() => { loadEvents(selectedDate); }, []);

  const selectedEvents = events.filter(ev => {
    const evDate = ev.start.dateTime ? parseISO(ev.start.dateTime) : parseISO(ev.start.date);
    return format(evDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  const openCreate = () => {
    setEditEvent(null);
    const dateStr = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
    setForm({ title: '', description: '', startDateTime: dateStr, endDateTime: dateStr });
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({
      title: ev.summary || '',
      description: ev.description || '',
      startDateTime: ev.start.dateTime ? ev.start.dateTime.slice(0, 16) : ev.start.date,
      endDateTime: ev.end.dateTime ? ev.end.dateTime.slice(0, 16) : ev.end.date,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title: form.title, description: form.description, startDateTime: form.startDateTime, endDateTime: form.endDateTime };
    if (editEvent) {
      await axios.put(`/calendar/${editEvent.id}`, payload);
    } else {
      await axios.post('/calendar', payload);
    }
    setShowForm(false);
    loadEvents(selectedDate);
  };

  const handleDelete = async (eventId) => {
    if (!confirm('일정을 삭제할까요?')) return;
    await axios.delete(`/calendar/${eventId}`);
    loadEvents(selectedDate);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="ko-KR"
          onActiveStartDateChange={({ activeStartDate }) => loadEvents(activeStartDate)}
          tileContent={({ date }) => {
            const hasEvent = events.some(ev => {
              const evDate = ev.start.dateTime ? parseISO(ev.start.dateTime) : parseISO(ev.start.date);
              return format(evDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            });
            return hasEvent ? <div className="w-1 h-1 bg-indigo-400 rounded-full mx-auto mt-0.5" /> : null;
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">
          {format(selectedDate, 'M월 d일 (eee)', { locale: ko })} 일정
        </h3>
        <button onClick={openCreate} className="bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-indigo-600 transition-colors">
          + 추가
        </button>
      </div>

      {selectedEvents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">이 날 일정이 없습니다</p>
      ) : (
        <ul className="space-y-2">
          {selectedEvents.map(ev => (
            <li key={ev.id} className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{ev.summary}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ev.start.dateTime ? `${format(parseISO(ev.start.dateTime), 'HH:mm')} ~ ${format(parseISO(ev.end.dateTime), 'HH:mm')}` : '종일'}
                </p>
                {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
              </div>
              <div className="flex gap-2 ml-2">
                <button onClick={() => openEdit(ev)} className="text-xs text-indigo-500 hover:underline">수정</button>
                <button onClick={() => handleDelete(ev.id)} className="text-xs text-red-400 hover:underline">삭제</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 일정 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{editEvent ? '일정 수정' : '일정 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="일정 제목"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <input type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.startDateTime} onChange={e => setForm({ ...form, startDateTime: e.target.value })} />
              <input type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.endDateTime} onChange={e => setForm({ ...form, endDateTime: e.target.value })} />
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 h-20 resize-none"
                placeholder="설명 (선택)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">취소</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600">{editEvent ? '수정' : '추가'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
