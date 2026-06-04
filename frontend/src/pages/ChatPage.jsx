import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const WELCOME = {
  id: 0,
  from: 'bot',
  text: '안녕하세요! 😊 내 플래너 어시스턴트예요.\n\n이렇게 말씀해 주세요:\n\n📅 "내일 오후 3시 팀미팅 일정 등록해줘"\n📋 "오늘 일정 알려줘"\n✅ "할일 추가: 보고서 작성"\n☑️ "할일 목록 보여줘"\n📆 "오늘 요약해줘"',
  time: new Date(),
};

const QUICK = ['오늘 일정 알려줘', '할일 목록 보여줘', '오늘 요약해줘', '내일 일정 뭐야?'];

export default function ChatPage() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg, time: new Date() }]);
    setLoading(true);

    try {
      const res = await axios.post('/chat', { message: msg });
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: res.data.reply, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: '오류가 발생했어요. 다시 시도해주세요.', time: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const fmt = (date) => `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="flex flex-col h-full -mx-4 -mt-4" style={{ height: 'calc(100vh - 56px - 56px)' }}>
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
            {msg.from === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-4">AI</div>
            )}
            <div className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'} max-w-[78%]`}>
              <div className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                msg.from === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-sm'
                  : 'bg-white shadow-sm text-gray-800 rounded-bl-sm border border-gray-100'
              }`}>
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">{fmt(msg.time)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-1.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 빠른 버튼 */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 active:bg-indigo-200 whitespace-nowrap transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <div className="px-3 py-2.5 bg-white border-t border-gray-200 flex gap-2 items-center">
        <input
          ref={inputRef}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300 transition-all"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-indigo-600 active:bg-indigo-700 flex-shrink-0 transition-colors text-base"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
