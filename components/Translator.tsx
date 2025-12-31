
import React, { useState } from 'react';
import { LANGUAGES } from '../constants';
import { translateToLanguage } from '../services/geminiService';
import { CopyIcon, CheckIcon } from './icons';

export const Translator: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[0].name);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!inputText.trim()) {
            setTranslatedText('');
            return;
        }
        setIsLoading(true);
        setError(null);
        setTranslatedText('');
        try {
            const result = await translateToLanguage(inputText, targetLanguage);
            setTranslatedText(result || '');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!translatedText) return;
        navigator.clipboard.writeText(translatedText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Quick Translator</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="input-text" className="block text-sm font-medium text-gray-400 mb-2">
                        Enter English text:
                    </label>
                    <textarea
                        id="input-text"
                        rows={4}
                        className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="e.g., You have beautiful eyes."
                    />
                </div>

                <div>
                    <label htmlFor="target-language" className="block text-sm font-medium text-gray-400 mb-2">
                        Translate to:
                    </label>
                    <select
                        id="target-language"
                        className="w-full bg-gray-700 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.name}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !inputText.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-md hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        "Translate"
                    )}
                </button>

                {error && <p className="text-red-400 text-center">{error}</p>}

                {translatedText && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Translated text:
                        </label>
                        <div className="relative bg-gray-900 p-4 rounded-md">
                            <p className="text-gray-200 whitespace-pre-wrap">{translatedText}</p>
                            <button 
                                onClick={handleCopy} 
                                aria-label="Copy translated text"
                                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {copied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon className="h-5 w-5"/>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
