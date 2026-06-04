export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-500 to-indigo-700 px-6">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-3xl font-bold text-white mb-2">내 플래너</h1>
        <p className="text-indigo-200 text-sm">일정 · 할일 · 메모를 한 곳에서</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">시작하기</h2>
        <a
          href="/auth/google"
          className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.5 2.7 13.5l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.5 28.5c-.5-1.5-.8-3.2-.8-4.9s.3-3.4.8-4.9l-7.8-6C1 15.9 0 19.8 0 24s1 8.1 2.7 11.3l7.8-6.8z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-7.8 6C6.7 42.5 14.7 48 24 48z"/>
          </svg>
          Google 계정으로 로그인
        </a>
        <p className="text-xs text-gray-400 text-center mt-4">
          Google 캘린더 연동을 위해 로그인이 필요합니다
        </p>
      </div>
    </div>
  );
}
