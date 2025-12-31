
import type { ChatSession } from '../types';

const SESSIONS_KEY = 'datingCoachSessions';

export const getSessions = (): ChatSession[] => {
  try {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  } catch (error) {
    console.error("Failed to parse sessions from localStorage", error);
    return [];
  }
};

export const saveSession = (sessionToSave: ChatSession): void => {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === sessionToSave.id);
  if (existingIndex > -1) {
    sessions[existingIndex] = sessionToSave;
  } else {
    sessions.unshift(sessionToSave); // Add new sessions to the top
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const deleteSession = (id: string): void => {
  let sessions = getSessions();
  sessions = sessions.filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};
