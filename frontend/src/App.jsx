import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import CalendarPage from './pages/CalendarPage';
import TodosPage from './pages/TodosPage';
import NotesPage from './pages/NotesPage';
import LoginPage from './pages/LoginPage';

axios.defaults.withCredentials = true;

function App() {
  const [loggedIn, setLoggedIn] = useState(null); // null = 확인 중

  useEffect(() => {
    axios.get('/auth/status').then(res => {
      setLoggedIn(res.data.loggedIn);
    });
  }, []);

  if (loggedIn === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-indigo-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
