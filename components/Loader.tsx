
import React from 'react';

const messages = [
    "Analyzing the vibe...",
    "Crafting the perfect reply...",
    "Decoding romantic signals...",
    "Consulting the love oracle...",
    "Assembling a charming response..."
];

export const Loader: React.FC = () => {
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
        setMessage(prev => {
            const currentIndex = messages.indexOf(prev);
            const nextIndex = (currentIndex + 1) % messages.length;
            return messages[nextIndex];
        });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg shadow-xl min-h-[300px]">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400"></div>
      <p className="text-white text-lg mt-6 font-semibold transition-opacity duration-500">{message}</p>
    </div>
  );
};
