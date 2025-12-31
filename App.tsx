
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { Loader } from './components/Loader';
import { analyzeConversation } from './services/geminiService';
import * as historyService from './services/historyService';
import type { AnalysisResult, ChatSession } from './types';
import { parseAnalysis } from './utils';
import { Translator } from './components/Translator';
import { LocationMarkerIcon, PhotoIcon } from './components/icons';

const Header: React.FC<{ view: 'coach' | 'translator', setView: (view: 'coach' | 'translator') => void }> = ({ view, setView }) => {
  const commonButtonClasses = "px-4 py-2 rounded-md font-semibold transition-colors";
  const activeButtonClasses = "bg-purple-600 text-white shadow-lg shadow-purple-500/20";
  const inactiveButtonClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";
  
  return (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
      <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
        Dating Coach AI
      </h1>
      <p className="text-gray-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
        Your personal AI to analyze chats and help you win hearts.
      </p>
      <nav className="mt-6 flex justify-center gap-4">
        <button 
          onClick={() => setView('coach')}
          className={`${commonButtonClasses} ${view === 'coach' ? activeButtonClasses : inactiveButtonClasses}`}
          aria-current={view === 'coach'}
        >
          Dating Coach
        </button>
        <button 
          onClick={() => setView('translator')}
          className={`${commonButtonClasses} ${view === 'translator' ? activeButtonClasses : inactiveButtonClasses}`}
          aria-current={view === 'translator'}
        >
          Translator
        </button>
      </nav>
    </header>
  );
};

const BossModeToggle: React.FC<{ isBossMode: boolean; onToggle: () => void, disabled?: boolean }> = ({ isBossMode, onToggle, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={isBossMode}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
      isBossMode 
      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-1 3V4a1 1 0 112 0v1h-2z" clipRule="evenodd" />
    </svg>
    <span>{isBossMode ? 'Boss Mode: ON' : 'Boss Mode'}</span>
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<'coach' | 'translator'>('coach');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [outfitSent, setOutfitSent] = useState<boolean>(false);
  const [isAskingLocation, setIsAskingLocation] = useState<boolean>(false);
  const [isAskingForPhoto, setIsAskingForPhoto] = useState<boolean>(false);

  useEffect(() => {
    let allSessions = historyService.getSessions();
    const lillySessionExists = allSessions.some(s => s.contactName === 'Lilly');
    const melRosSessionExists = allSessions.some(s => s.contactName === 'Mel Ros');

    if (!lillySessionExists) {
      const lillySession: ChatSession = {
        id: `lilly-${Date.now()}`,
        contactName: 'Lilly',
        history: [],
        isBossMode: false,
        goal: 'getNumber',
        personalContext: "This is a new crush I want to get to know better.",
        language: 'en',
      };
      historyService.saveSession(lillySession);
      allSessions = historyService.getSessions();
    }

    if (!melRosSessionExists) {
      const melRosSession: ChatSession = {
        id: `melros-${Date.now()}`,
        contactName: 'Mel Ros',
        history: [],
        isBossMode: false,
        goal: 'rapport',
        personalContext: "This is a new crush who speaks Spanish. Please provide all replies in natural, casual Spanish.",
        language: 'es',
      };
      historyService.saveSession(melRosSession);
      allSessions = historyService.getSessions();
    }
    
    setSessions(allSessions);

  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleAnalyze = useCallback(async (imageBase64: string, imageFile: File) => {
    if (!currentSession) return;
    setIsLoading(true);
    setError(null);
    setLatestAnalysis(null);
    setUploadedImage(URL.createObjectURL(imageFile));

    try {
      const resultText = await analyzeConversation(
        imageBase64, 
        imageFile.type, 
        currentSession.isBossMode,
        currentSession.goal,
        outfitSent, 
        isAskingLocation,
        isAskingForPhoto,
        currentSession.history,
        currentSession.personalContext,
        currentSession.feedbackLog
      );
      if (resultText) {
        const parsedData = parseAnalysis(resultText);
        setLatestAnalysis(parsedData);
        
        const updatedSession = { ...currentSession };
        if (currentSession.contactName === 'New Chat' && parsedData.detectedName !== 'Unknown') {
          updatedSession.contactName = parsedData.detectedName;
        }
        updatedSession.history.push(parsedData.summary);
        historyService.saveSession(updatedSession);
        setSessions(historyService.getSessions());

      } else {
        setError("The analysis returned an empty result. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the conversation. Please check your image or try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, outfitSent, isAskingLocation, isAskingForPhoto]);

  const handleRateReply = useCallback((reply: string, rating: 'positive' | 'negative') => {
    if (!currentSession) return;
    
    const feedbackLog = currentSession.feedbackLog || [];
    const existingIndex = feedbackLog.findIndex(item => item.reply === reply);
    
    let updatedLog;
    if (existingIndex > -1) {
        updatedLog = [...feedbackLog];
        updatedLog[existingIndex] = { reply, rating };
    } else {
        updatedLog = [...feedbackLog, { reply, rating }];
    }

    const updatedSession = { ...currentSession, feedbackLog: updatedLog };
    historyService.saveSession(updatedSession);
    setSessions(historyService.getSessions());
  }, [currentSession]);

  const handleNewChat = (isBossMode: boolean, goal: ChatSession['goal']) => {
    const isFirstEverSession = sessions.length === 0;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      contactName: 'New Chat',
      history: [],
      isBossMode: isBossMode,
      goal: goal,
      personalContext: isFirstEverSession ? "I have not spent with a girl in the house for a week" : "",
      language: 'en',
    };
    historyService.saveSession(newSession);
    setSessions(historyService.getSessions());
    setCurrentSessionId(newSession.id);
  };
  
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };
  
  const handleDeleteSession = (id: string) => {
      if (window.confirm("Are you sure you want to delete this conversation?")) {
        historyService.deleteSession(id);
        const remainingSessions = historyService.getSessions();
        setSessions(remainingSessions);
        if (currentSessionId === id) {
            setCurrentSessionId(null);
        }
      }
  };

  const resetToHome = () => {
    setCurrentSessionId(null);
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };

  const analyzeNextInSession = () => {
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };


  const SessionListView = () => {
    const [isBossModeForNew, setIsBossModeForNew] = useState(false);
    const [goalForNew, setGoalForNew] = useState<ChatSession['goal']>('rapport');

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Start a New Chat</h2>
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Set a Goal:</label>
                    <div className="flex rounded-md shadow-sm">
                        <button 
                            type="button"
                            onClick={() => setGoalForNew('rapport')} 
                            className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-md w-1/2 ${goalForNew === 'rapport' ? 'bg-purple-600 text-white z-10 ring-1 ring-purple-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Build Rapport
                        </button>
                        <button 
                            type="button"
                            onClick={() => setGoalForNew('getNumber')} 
                            className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-md w-1/2 -ml-px ${goalForNew === 'getNumber' ? 'bg-purple-600 text-white z-10 ring-1 ring-purple-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Get Number
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                    <button onClick={() => handleNewChat(isBossModeForNew, goalForNew)} className="flex-grow px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-md hover:opacity-90 transition-opacity shadow-lg">
                        + New Conversation
                    </button>
                    <BossModeToggle isBossMode={isBossModeForNew} onToggle={() => setIsBossModeForNew(!isBossModeForNew)} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Your Conversations</h2>
            <div className="space-y-4">
                {sessions.length > 0 ? sessions.map(session => (
                    <div key={session.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg transition-transform hover:scale-105 border border-gray-700/50">
                        <button onClick={() => handleSelectSession(session.id)} className="text-left flex-grow">
                            <h3 className="font-bold text-lg text-white">{session.contactName} {session.isBossMode && '💼'} {session.language === 'es' && '🇪🇸'}</h3>
                            <p className="text-sm text-gray-400">{session.history.length} screenshots analyzed</p>
                            {session.goal === 'getNumber' && <p className="text-xs text-cyan-400 font-semibold mt-1 uppercase tracking-wider">Goal: Get Number</p>}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )) : <p className="text-center text-gray-500 py-8">No conversations yet. Start a new one!</p>}
            </div>
        </div>
    );
  };

  const ChatView = () => {
    const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
    const [contextInput, setContextInput] = useState(currentSession?.personalContext || '');

    useEffect(() => {
        setContextInput(currentSession?.personalContext || '');
    }, [currentSession?.id, currentSession?.personalContext]);

    const handleSaveContext = () => {
        if (!currentSession) return;
        const updatedSession = { ...currentSession, personalContext: contextInput };
        historyService.saveSession(updatedSession);
        setSessions(historyService.getSessions());
        setIsContextEditorOpen(false);
    };

    return (
      <div className="max-w-4xl mx-auto">
          {isLoading ? (
              <Loader />
          ) : latestAnalysis ? (
              <AnalysisDisplay 
                result={latestAnalysis} 
                uploadedImage={uploadedImage} 
                onAnalyzeNext={analyzeNextInSession} 
                onBack={resetToHome} 
                onRateReply={handleRateReply}
                session={currentSession} 
              />
          ) : (
              <>
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                      <button onClick={resetToHome} className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors">
                          &larr; <span>Back to Chats</span>
                      </button>
                      <div className="text-right flex items-center gap-3">
                          <div>
                              <h2 className="text-xl font-bold text-white">{currentSession?.contactName}</h2>
                              {currentSession?.isBossMode && <p className="text-sm font-semibold text-red-400">Boss Mode</p>}
                              {currentSession?.goal === 'getNumber' && <p className="text-sm font-semibold text-cyan-400">Goal: Get Number</p>}
                          </div>
                           <button onClick={() => setIsContextEditorOpen(!isContextEditorOpen)} title="Edit Personal Context" className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            </button>
                      </div>
                  </div>
                  
                  {isContextEditorOpen && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-lg">
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">My Personal Context</h3>
                      <p className="text-sm text-gray-400 mb-3">Add any personal details here. I'll use this to give you more tailored advice.</p>
                      <textarea
                          value={contextInput}
                          onChange={(e) => setContextInput(e.target.value)}
                          className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          rows={3}
                          placeholder="e.g., I'm feeling a bit tired this week, looking for something low-effort..."
                      />
                      <div className="text-right mt-3">
                        <button onClick={handleSaveContext} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold text-sm">
                          Save Context
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-4 mb-6 flex-wrap">
                        <button
                          onClick={() => setIsAskingForPhoto(!isAskingForPhoto)}
                          aria-pressed={isAskingForPhoto}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingForPhoto 
                              ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <PhotoIcon className="h-5 w-5" />
                            <span>{isAskingForPhoto ? 'Asking for Photo' : 'Ask for Photo?'}</span>
                        </button>
                        <button
                          onClick={() => setIsAskingLocation(!isAskingLocation)}
                          aria-pressed={isAskingLocation}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingLocation 
                              ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <LocationMarkerIcon className="h-5 w-5" />
                            <span>{isAskingLocation ? 'Asking Location' : 'Ask Location?'}</span>
                        </button>
                       <button
                          onClick={() => setOutfitSent(!outfitSent)}
                          aria-pressed={outfitSent}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              outfitSent 
                              ? 'bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M17.707 3.293a1 1 0 00-1.414 0L9 10.586 4.707 6.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l9-9a1 1 0 000-1.414z" />
                          </svg>
                          <span>{outfitSent ? 'Outfit Sent' : 'Outfit Sent?'}</span>
                      </button>
                  </div>
                  <ImageUploader onAnalyze={handleAnalyze} error={error} />
              </>
          )}
      </div>
    )
  };

  const CoachView = () => (
    currentSessionId ? <ChatView /> : <SessionListView />
  );

  return (
    <div className="min-h-screen bg-gray-900 font-sans selection:bg-purple-500/30">
      <Header view={view} setView={setView} />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'coach' ? <CoachView /> : <Translator />}
      </main>
      <footer className="text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Powered by Gemini. Built for educational and entertainment purposes.</p>
      </footer>
    </div>
  );
};

export default App;
