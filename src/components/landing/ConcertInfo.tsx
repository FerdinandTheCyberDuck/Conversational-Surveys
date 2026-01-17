'use client';

import type { Concert } from '@/types';

interface ConcertInfoProps {
  concert: Concert;
}

export default function ConcertInfo({ concert }: ConcertInfoProps) {
  const formatDate = (timestamp: { toDate?: () => Date; seconds?: number; nanoseconds?: number } | Date) => {
    let date: Date;

    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return 'Date not available';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="mb-4">
        <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
          {concert.organization}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          {concert.title}
        </h1>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(concert.date)}
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {concert.venue}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Program
        </h2>
        <ul className="space-y-3">
          {concert.program
            .sort((a, b) => a.order - b.order)
            .map((piece) => (
              <li key={piece.id} className="border-l-2 border-indigo-200 pl-4">
                <p className="font-medium text-gray-900">
                  {piece.composer}
                  {piece.composerDates && (
                    <span className="text-gray-500 font-normal ml-1">
                      ({piece.composerDates})
                    </span>
                  )}
                </p>
                <p className="text-gray-700">{piece.workTitle}</p>
                {piece.soloist && (
                  <p className="text-sm text-indigo-600 mt-1">{piece.soloist}</p>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
