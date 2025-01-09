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
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
      {isExpanded ? (
        <div className="w-48 rounded-2xl bg-background p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-102 border border-border">
          <div className="mb-2 rounded-xl bg-background/80 p-1.5">
            <button
              onClick={toggleCalculator}
              className="text-[10px] text-primary hover:text-primary/80"
            >
              {isExpanded ? "Close" : "Open"} Calculator
            </button>
          </div>

          <div className="mb-2 h-12 overflow-hidden rounded-lg bg-background/80 p-1.5">
            <div className="text-right text-xs text-muted-foreground">{calculation || '0'}</div>
            <div className="text-right text-lg font-bold text-primary">{result || '0'}</div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleButtonClick(btn === '÷' ? '/' : btn === '×' ? '*' : btn)}
                className="rounded-lg bg-background/80 p-1.5 text-center text-sm hover:bg-muted active:bg-muted/80"
              >
                {btn}
              </button>
            ))}
          </div>

          <button
            onClick={toggleCalculator}
            className="rounded-full bg-background p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 border border-border"
          >
            <div className="flex items-center space-x-1 text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4zm2 2v2h8V6H6zm0 4v2h3v-2H6zm5 0v2h3v-2h-3zm-5 4v2h3v-2H6zm5 0v2h3v-2h-3z"/>
              </svg>
              <span className="text-xs">Calculator</span>
            </div>
          </button>
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