
import React, { useState } from 'react';
import type { AnalysisResult, ChatSession, SimpleResponse } from '../types';
import { translateText } from '../services/geminiService';
import { CopyIcon, CheckIcon, TranslateIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons';

interface ReplyCardProps {
    item: SimpleResponse;
    sessionLanguage?: ChatSession['language'];
    onRate: (rating: 'positive' | 'negative') => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({ item, sessionLanguage, onRate }) => {
    const [copied, setCopied] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [userRating, setUserRating] = useState<'positive' | 'negative' | null>(item.rating || null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleTranslate = async (text: string) => {
        setIsTranslating(true);
        const result = await translateText(text);
        setTranslation(result || "Could not retrieve translation.");
        setIsTranslating(false);
    };

    const handleRating = (rating: 'positive' | 'negative') => {
        if (userRating === rating) return;
        setUserRating(rating);
        onRate(rating);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold bg-gradient-to-r from-green-400 to-cyan-500 text-transparent bg-clip-text">
                    {item.title}
                </h4>
            </div>
            
            <div className="relative">
                <p className="text-gray-200 bg-gray-900 p-4 pr-12 rounded-md whitespace-pre-wrap">
                    {item.reply}
                </p>
                <button 
                    onClick={() => handleCopy(item.reply)} 
                    aria-label="Copy reply"
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {copied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon className="h-5 w-5"/>}
                </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Helpful?</span>
                    <div className="flex items-center bg-gray-900 rounded-lg p-1">
                        <button
                            onClick={() => handleRating('positive')}
                            className={`p-1.5 rounded-md transition-all duration-200 ${
                                userRating === 'positive' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'text-gray-500 hover:text-green-400 hover:bg-gray-800'
                            }`}
                            title="This is a great suggestion"
                        >
                            <ThumbsUpIcon className="h-4 w-4" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => handleRating('negative')}
                            className={`p-1.5 rounded-md transition-all duration-200 ${
                                userRating === 'negative' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'text-gray-500 hover:text-red-400 hover:bg-gray-800'
                            }`}
                            title="This doesn't feel right"
                        >
                            <ThumbsDownIcon className="h-4 w-4" />
                        </button>
                    </div>
                    {userRating && (
                        <span className="text-xs text-gray-400 animate-fade-in">Feedback recorded!</span>
                    )}
                </div>

                {sessionLanguage === 'es' && (
                    <div>
                        {translation ? (
                            <div className="bg-gray-900 px-3 py-2 rounded-md border-l-2 border-purple-400">
                                <p className="text-xs font-semibold text-purple-300">Translation:</p>
                                <p className="text-sm text-gray-300 italic">{translation}</p>
                            </div>
                        ) : (
                             <button 
                                onClick={() => handleTranslate(item.reply)}
                                disabled={isTranslating}
                                className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 disabled:opacity-50 transition-colors"
                            >
                                {isTranslating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-200"></div>
                                        <span>Translating...</span>
                                    </>
                                ) : (
                                    <>
                                        <TranslateIcon className="h-4 w-4" />
                                        <span>Translate</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface AnalysisDisplayProps {
  result: AnalysisResult;
  uploadedImage: string | null;
  onAnalyzeNext: () => void;
  onBack: () => void;
  onRateReply: (reply: string, rating: 'positive' | 'negative') => void;
  session: ChatSession | null;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, uploadedImage, onAnalyzeNext, onBack, onRateReply, session }) => {
  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Replies are Ready!</h2>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={onBack}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                    &larr; Back to Chats
                </button>
                <button 
                    onClick={onAnalyzeNext}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold shadow-lg shadow-purple-500/20"
                >
                    Analyze Next
                </button>
            </div>
        </div>
        
        {uploadedImage && <img src={uploadedImage} alt="Uploaded conversation" className="rounded-xl shadow-2xl max-h-96 mx-auto w-auto object-contain border border-gray-700" />}
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-inner">
        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Conversation Context:</h3>
        <p className="text-gray-300 leading-relaxed">{result.summary}</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-purple-500/10 rounded-lg">💬</span>
            Ready-to-Send Replies
        </h3>
        {result.replies.map((item, i) => (
            <ReplyCard 
                key={i} 
                item={item} 
                sessionLanguage={session?.language} 
                onRate={(rating) => onRateReply(item.reply, rating)}
            />
        ))}
      </div>
    </div>
  );
};
