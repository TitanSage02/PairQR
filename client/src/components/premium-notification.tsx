import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Sparkles, Users, Zap, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PremiumNotificationProps {
  onDismiss: () => void;
}

export function PremiumNotification({ onDismiss }: PremiumNotificationProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const features = [
    { icon: Users, text: 'Team collaboration spaces' },
    { icon: Zap, text: 'Faster transfer speeds' },
    { icon: Shield, text: 'Advanced security features' },
    { icon: Mail, text: 'File expiration controls' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          timestamp: new Date().toISOString(),
          source: 'premium_notification'
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "You're on the list!",
          description: "We'll notify you when premium features are available.",
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto mt-8 border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Welcome to the Waitlist!
          </h3>
          <p className="text-green-700 mb-4">
            You'll be among the first to know when premium features launch.
          </p>
          <Button 
            onClick={onDismiss}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            Continue Using Free Version
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Coming Soon
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Love PairQR? Premium is Coming!
          </h3>
          <p className="text-gray-600">
            We're working on premium features for teams and power users. 
            Join the waitlist to get early access and special pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
              <feature.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={isSubmitting}
            required
          />
          <Button 
            type="submit"
            disabled={isSubmitting || !email}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Join Waitlist
              </div>
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 mt-3 text-center">
          We respect your privacy. No spam, unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  );
}
