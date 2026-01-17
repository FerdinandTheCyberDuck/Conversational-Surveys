'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-xs font-medium text-indigo-600 mb-1">Interviewer</p>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
