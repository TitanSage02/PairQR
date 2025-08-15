import { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Download, Info, LogOut, Lock, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  connectionQuality: string;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onShowSessionInfo: () => void;
  onEndSession: () => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInterface({
  messages,
  connectionQuality,
  onSendMessage,
  onClearChat,
  onExportChat,
  onShowSessionInfo,
  onEndSession,
  onTyping
}: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessageChange = (value: string) => {
    setMessageText(value);
    
    // Handle typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
      setIsTyping(false);
      onTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Connection Status Bar */}
      <div className="bg-white rounded-t-2xl border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">Connected via P2P</span>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">Encrypted</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-muted flex items-center space-x-1">
              <Signal className="w-3 h-3" />
              <span>{connectionQuality}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onEndSession}
              className="text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Chat Interface */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-b-2xl overflow-hidden">
        
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
          
          {/* System Message */}
          <div className="text-center">
            <div className="inline-block bg-white px-4 py-2 rounded-full text-sm text-muted border border-gray-200">
              <Lock className="w-4 h-4 inline mr-2 text-secondary" />
              End-to-end encrypted connection established
            </div>
          </div>
          
          {/* Messages */}
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`px-4 py-3 rounded-lg max-w-xs lg:max-w-md ${
                message.isLocal 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <div className={`text-xs mt-1 flex items-center ${
                  message.isLocal ? 'justify-end space-x-1 text-blue-100' : 'text-muted'
                }`}>
                  <span>{formatTime(message.timestamp)}</span>
                  {message.isLocal && (
                    <i className="fas fa-check-double"></i>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Type your message..." 
                rows={3}
                value={messageText}
                onChange={(e) => handleMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              
              {/* Encryption Indicator */}
              <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-xs text-muted">
                <Lock className="w-3 h-3 text-secondary" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-primary text-white hover:bg-blue-700 p-3"
              >
                <Send className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={onClearChat}
                variant="outline"
                className="p-3"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Character Count & Status */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted">
            <div className="flex items-center space-x-4">
              <span>{messageText.length} / 1000 characters</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>AES-256 Active</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isTyping && (
                <span className="text-amber-600">Typing...</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Controls */}
      <div className="mt-6 flex justify-center space-x-4">
        <Button
          onClick={onExportChat}
          variant="outline"
          className="text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Chat
        </Button>
        
        <Button
          onClick={onShowSessionInfo}
          variant="outline"
          className="text-sm"
        >
          <Info className="w-4 h-4 mr-2" />
          Session Info
        </Button>
        
        <Button
          onClick={onEndSession}
          className="bg-red-500 text-white hover:bg-red-600 text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          End Session
        </Button>
      </div>
    </div>
  );
}
