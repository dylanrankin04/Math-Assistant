import React, { useState, useEffect, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
}

// Add types for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const MATH_SYMBOLS = [
    { label: '+', value: '+' },
    { label: '-', value: '-' },
    { label: '×', value: '×' },
    { label: '÷', value: '÷' },
    { label: '=', value: '=' },
    { label: 'x²', value: '²' },
    { label: '√', value: '√' },
    { label: 'π', value: 'π' },
    { label: 'a/b', value: '/' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onUploadClick }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
            setInput(prev => {
                const trailingSpace = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                return prev + trailingSpace + finalTranscript;
            });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported) {
        alert("Your browser does not support voice input. Please try using Chrome or Safari.");
        return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
          console.error("Failed to start recognition", e);
      }
    }
  };

  const insertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = input.substring(0, start) + symbol + input.substring(end);
        setInput(newValue);
        // Defer focus to ensure state update renders first
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 0);
    } else {
        setInput(prev => prev + symbol);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      // Reset height if needed, though rows=1 usually handles standard
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-2">
      {/* Math Toolbar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          {MATH_SYMBOLS.map((sym) => (
              <button
                key={sym.label}
                type="button"
                onClick={() => insertSymbol(sym.value)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium border border-gray-200 transition-colors whitespace-nowrap"
              >
                  {sym.label}
              </button>
          ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-4 bg-white rounded-3xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 p-2 transition-shadow duration-200 shadow-sm">
        
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={onUploadClick}
          disabled={isLoading}
          className="text-gray-500 hover:text-blue-500 p-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Upload an image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Microphone Button - Always shown now */}
        <button
        type="button"
        onClick={toggleListening}
        disabled={isLoading}
        className={`p-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-shrink-0 ${
            isListening 
            ? 'text-red-500 bg-red-50 animate-pulse ring-2 ring-red-200' 
            : 'text-gray-500 hover:text-blue-500'
        } disabled:text-gray-300 disabled:cursor-not-allowed`}
        aria-label="Toggle voice input"
        title={isSpeechSupported ? "Speak to type" : "Voice input not supported on this browser"}
        >
        {isListening ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
             </svg>
        ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
        )}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isListening ? "Listening..." : "Type your math problem..."}
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none outline-none p-2 text-gray-800 placeholder-gray-500 min-h-[44px] max-h-32 py-3"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white rounded-full p-2.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;