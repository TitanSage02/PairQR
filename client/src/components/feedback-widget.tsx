import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, X, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackWidgetProps {
  onClose: () => void;
  sessionInfo?: {
    duration: number;
    messageCount: number;
    connectionQuality: string;
  };
}

export function FeedbackWidget({ onClose, sessionInfo }: FeedbackWidgetProps) {
  const [step, setStep] = useState<'rating' | 'feedback' | 'thanks'>('rating');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: 'bug', label: 'Bug Report', emoji: '🐛' },
    { id: 'feature', label: 'Feature Request', emoji: '💡' },
    { id: 'improvement', label: 'Improvement', emoji: '⚡' },
    { id: 'praise', label: 'Compliment', emoji: '❤️' },
    { id: 'other', label: 'Other', emoji: '💬' }
  ];

  const handleRatingSubmit = () => {
    if (rating === 0) return;
    setStep('feedback');
  };

  const handleFeedbackSubmit = async () => {
    setIsSubmitting(true);

    try {
      const feedbackData = {
        rating,
        feedback: feedback.trim(),
        category,
        sessionInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.split(' ').slice(0, 3).join(' '), // Partial UA for context
        viewport: {
          width: Math.round(window.innerWidth / 100) * 100,
          height: Math.round(window.innerHeight / 100) * 100
        }
      };

      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      setStep('thanks');
      
      toast({
        title: "Feedback Sent!",
        description: "Thank you for helping us improve InstantShare.",
      });

      // Auto-close after showing thanks
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Feedback
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'rating' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">How was your experience?</h3>
                <p className="text-gray-600 text-sm">Your feedback helps us improve InstantShare</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1 transition-colors"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    {getRatingText(rating)}
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'feedback' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Tell us more {rating >= 4 ? '😊' : rating >= 3 ? '🙂' : '😔'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {rating >= 4 
                    ? "What did you love about InstantShare?"
                    : "How can we improve your experience?"
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        category === cat.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-1">{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Feedback</label>
                <Textarea
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {feedback.length}/1000 characters
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('rating')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={isSubmitting || (!feedback.trim() && category === '')}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'thanks' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🙏</div>
              <h3 className="text-lg font-semibold">Thank You!</h3>
              <p className="text-gray-600">
                Your feedback helps us make InstantShare better for everyone.
              </p>
              <div className="text-sm text-gray-500">
                This window will close automatically...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
