import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  role: 'user' | 'model';
  text: string;
  image?: string;
  onReview?: (text: string) => void;
}

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
        You
    </div>
);

const AssistantIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.545 2.91A5.974 5.974 0 015 13h10a5.974 5.974 0 01-1.455 1.91A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
    </div>
);


const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, image, onReview }) => {
  const isUser = role === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white shadow-md'
    : 'bg-white text-gray-800 border border-gray-200 shadow-sm';
  
  const containerClasses = isUser
    ? 'flex justify-end items-start gap-3'
    : 'flex justify-start items-start gap-3';

  return (
    <div className={containerClasses}>
      {!isUser && <AssistantIcon />}
      <div className={`rounded-2xl p-4 max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-xl break-words ${bubbleClasses}`}>
        {image && (
          <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
            <img src={image} alt="User upload" className="rounded-lg max-w-full h-auto" />
          </div>
        )}
        
        {text && (
          <div className={`markdown-content ${isUser ? 'prose-invert text-white' : 'prose prose-blue prose-sm max-w-none text-gray-800'}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }: any) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`${isUser ? 'text-white' : 'text-blue-600'} underline font-bold hover:opacity-80 transition-opacity cursor-pointer`}
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => <code className={`${isUser ? 'bg-blue-700' : 'bg-gray-100'} rounded px-1 text-sm font-mono`}>{children}</code>
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Review Button - Only for Model messages */}
        {!isUser && onReview && (
             <div className="mt-3 pt-2 border-t border-gray-200/50">
                <button 
                    onClick={() => onReview(text)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
                    title="Get a new explanation and a practice problem"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Review & Practice
                </button>
            </div>
        )}
      </div>
      {isUser && <UserIcon />}
    </div>
  );
};

export default ChatBubble;