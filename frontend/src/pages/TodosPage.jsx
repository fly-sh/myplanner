import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = () => axios.get('/todos').then(res => setTodos(res.data));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await axios.post('/todos', { title: input, due_date: dueDate || undefined });
    setInput('');
    setDueDate('');
    load();
  };

  const toggle = async (id) => {
    await axios.patch(`/todos/${id}/toggle`);
    load();
  };

  const remove = async (id) => {
    await axios.delete(`/todos/${id}`);
    load();
  };

  const pending = todos.filter(t => !t.is_completed);
  const done = todos.filter(t => t.is_completed);

  return (
    <div className="space-y-4">
      {/* 입력 폼 */}
      <form onSubmit={add} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="새 할일 입력..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="flex gap-2">
          <input type="date" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-600">추가</button>
        </div>
      </form>

      {/* 미완료 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">할일 {pending.length}개</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">모든 할일을 완료했어요 🎉</p>
        ) : (
          <ul className="space-y-2">
            {pending.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
            ))}
          </ul>
        )}
      </div>

      {/* 완료됨 */}
      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">완료됨 {done.length}개</h3>
          <ul className="space-y-2 opacity-60">
            {done.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
      <button onClick={() => onToggle(todo.id)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          todo.is_completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
        }`}>
        {todo.is_completed && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.title}</p>
        {todo.due_date && <p className="text-xs text-gray-400 mt-0.5">마감: {todo.due_date}</p>}
      </div>
      <button onClick={() => onDelete(todo.id)} className="text-gray-300 hover:text-red-400 text-lg ml-1">×</button>
    </li>
  );
}
