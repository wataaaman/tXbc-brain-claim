import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Trash2,
  Lightbulb,
  Brain
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const suggestedQuestions = [
  "What is the difference between Group 1 and Group 2 TBI?",
  "How do I request my complete claim file?",
  "What is interim relief and how do I apply?",
  "What should I do if my claim is denied?",
  "How long does WCB have to respond to my request?",
  "What medical records can I request from WCB?"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          session_id: sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to get response');
        // Remove the user message on error
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error('Failed to connect to AI assistant');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in h-[calc(100vh-5rem)]">
        <div className="grid lg:grid-cols-4 gap-6 h-full">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="card-warm flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">WCB Policy Assistant</CardTitle>
                      <CardDescription>Ask questions about your claim and WCB policies</CardDescription>
                    </div>
                  </div>
                  {messages.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearChat}
                      className="rounded-full"
                      data-testid="clear-chat-btn"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                          I'm here to answer your questions about Alberta WCB policies, 
                          TBI classifications, claim processes, and your rights as an injured worker.
                        </p>
                        <div className="grid gap-2">
                          {suggestedQuestions.slice(0, 3).map((question, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="text-left h-auto py-3 px-4 rounded-xl justify-start"
                              onClick={() => handleSuggestedQuestion(question)}
                              data-testid={`suggested-q-${i}`}
                            >
                              <Lightbulb className="w-4 h-4 mr-2 shrink-0 text-primary" />
                              <span className="text-sm">{question}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                          data-testid={`message-${index}`}
                        >
                          {message.role === 'assistant' && (
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === 'user' && (
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-secondary">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border/50 shrink-0">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                      placeholder="Ask about WCB policies, TBI classifications, or your claim..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      className="min-h-[48px] max-h-32 resize-none"
                      rows={1}
                      data-testid="chat-input"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-12 w-12 rounded-full shrink-0"
                      disabled={isLoading || !input.trim()}
                      data-testid="send-message-btn"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <Card className="card-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full text-left h-auto py-2 px-3 justify-start text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="card-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">About This Assistant</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  This AI assistant is trained on Alberta WCB policies 
                  to help you understand your rights and navigate the claims process.
                </p>
                <p>
                  It can help you understand TBI classifications, explain policy requirements, 
                  and guide you through creating request letters.
                </p>
                <p className="text-xs">
                  Powered by GPT-5.2
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
