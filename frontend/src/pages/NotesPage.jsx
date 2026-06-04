import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(null); // null or note object
  const [form, setForm] = useState({ title: '', content: '' });

  const load = () => axios.get('/notes').then(res => setNotes(res.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing('new');
    setForm({ title: '', content: '' });
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content || '' });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editing === 'new') {
      await axios.post('/notes', form);
    } else {
      await axios.put(`/notes/${editing.id}`, form);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('메모를 삭제할까요?')) return;
    await axios.delete(`/notes/${id}`);
    load();
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <h3 className="font-semibold text-gray-700">{editing === 'new' ? '새 메모' : '메모 수정'}</h3>
        </div>
        <input
          className="w-full border-b border-gray-200 py-2 text-lg font-medium focus:outline-none focus:border-indigo-400 bg-transparent"
          placeholder="제목"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full min-h-64 text-sm text-gray-700 focus:outline-none resize-none bg-transparent"
          placeholder="내용을 입력하세요..."
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
        />
        <button onClick={handleSave} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-600">
          저장
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">메모</h2>
        <button onClick={openCreate} className="bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-indigo-600">
          + 새 메모
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">메모가 없습니다</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => openEdit(note)}
              className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-gray-800 text-sm truncate flex-1">{note.title}</p>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                  className="text-gray-300 hover:text-red-400 text-lg ml-1 flex-shrink-0"
                >×</button>
              </div>
              {note.content && <p className="text-xs text-gray-400 line-clamp-3">{note.content}</p>}
              <p className="text-xs text-gray-300 mt-2">
                {format(parseISO(note.updated_at), 'M/d HH:mm', { locale: ko })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
