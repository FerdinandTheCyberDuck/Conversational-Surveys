'use client';

import { useState } from 'react';
import type { Concert, ParticipantFormData, ParticipantRole } from '@/types';
import { PARTICIPANT_ROLES } from '@/types';

interface ParticipantFormProps {
  concert: Concert;
  onSubmit: (data: ParticipantFormData) => void;
  isLoading?: boolean;
}

export default function ParticipantForm({ concert, onSubmit, isLoading }: ParticipantFormProps) {
  const [formData, setFormData] = useState<ParticipantFormData>({
    name: '',
    role: 'section_player',
    instrument: '',
    piecesToDiscuss: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ParticipantFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ParticipantFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (formData.piecesToDiscuss.length === 0) {
      newErrors.piecesToDiscuss = 'Please select at least one piece to discuss';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const togglePiece = (pieceId: string) => {
    setFormData(prev => ({
      ...prev,
      piecesToDiscuss: prev.piecesToDiscuss.includes(pieceId)
        ? prev.piecesToDiscuss.filter(id => id !== pieceId)
        : [...prev.piecesToDiscuss, pieceId],
    }));
    // Clear error when user selects a piece
    if (errors.piecesToDiscuss) {
      setErrors(prev => ({ ...prev, piecesToDiscuss: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Share Your Perspective
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Your insights will help create listening guides for our audience. This should take about 10-15 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Your Role
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as ParticipantRole }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PARTICIPANT_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Instrument (optional) */}
        <div>
          <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 mb-1">
            Instrument / Voice Type <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            id="instrument"
            value={formData.instrument}
            onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Violin, Soprano, Clarinet"
          />
        </div>

        {/* Pieces to Discuss */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which pieces would you like to discuss?
          </label>
          <div className="space-y-2">
            {concert.program
              .sort((a, b) => a.order - b.order)
              .map((piece) => (
                <label
                  key={piece.id}
                  className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                    formData.piecesToDiscuss.includes(piece.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.piecesToDiscuss.includes(piece.id)}
                    onChange={() => togglePiece(piece.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      {piece.composer}: {piece.workTitle}
                    </span>
                    {piece.soloist && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {piece.soloist}
                      </span>
                    )}
                  </span>
                </label>
              ))}
          </div>
          {errors.piecesToDiscuss && (
            <p className="mt-2 text-sm text-red-600">{errors.piecesToDiscuss}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting...
            </span>
          ) : (
            'Start Conversation'
          )}
        </button>
      </form>
    </div>
  );
}
