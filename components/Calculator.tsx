import { useState, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

export default function Calculator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [calculation, setCalculation] = useState('');
  const [result, setResult] = useState('');

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      try {
        const evalResult = eval(calculation);
        setResult(evalResult.toString());
        setCalculation(evalResult.toString());
      } catch {
        setResult('Error');
      }
    } else if (value === 'C') {
      setCalculation('');
      setResult('');
    } else {
      setCalculation(prev => prev + value);
    }
  };

  const toggleCalculator = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
      {isExpanded ? (
        <div className="w-48 rounded-2xl bg-pink-50/95 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-102 dark:bg-gray-800/95 border border-pink-100 dark:border-gray-700">
          <div className="mb-2 rounded-xl bg-white/80 p-1.5 dark:bg-gray-700/80">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-pink-400"></div>
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
              </div>
              <button 
                onClick={toggleCalculator}
                className="text-[10px] text-pink-400 dark:text-pink-300 hover:text-pink-600 dark:hover:text-pink-400"
              >
                ✨ calc ▼
              </button>
            </div>
          </div>
          
          <div className="mb-2 h-12 overflow-hidden rounded-lg bg-white/80 p-1.5 dark:bg-gray-900/80">
            <div className="text-right text-xs text-gray-600 dark:text-gray-400">{calculation || '0'}</div>
            <div className="text-right text-lg font-bold text-pink-600 dark:text-pink-300">{result || '0'}</div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleButtonClick(btn === '÷' ? '/' : btn === '×' ? '*' : btn)}
                className="rounded-lg bg-white/80 p-1.5 text-center text-sm hover:bg-pink-100 active:bg-pink-200 dark:bg-gray-700/80 dark:hover:bg-gray-600 dark:active:bg-gray-500"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={toggleCalculator}
          className="rounded-full bg-pink-50/95 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 dark:bg-gray-800/95 border border-pink-100 dark:border-gray-700"
        >
          <div className="flex items-center space-x-1 text-pink-400 dark:text-pink-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4zm2 2v2h8V6H6zm0 4v2h3v-2H6zm5 0v2h3v-2h-3zm-5 4v2h3v-2H6zm5 0v2h3v-2h-3z"/>
            </svg>
            <span className="text-xs">▲</span>
          </div>
        </button>
      )}
    </div>
  );
} 