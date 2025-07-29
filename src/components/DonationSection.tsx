import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Coffee, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const donationAmounts = [
  { amount: 500, label: '$5', icon: Coffee, description: 'Buy us a coffee' },
  { amount: 1500, label: '$15', icon: Heart, description: 'Show some love' },
  { amount: 5000, label: '$50', icon: Zap, description: 'Power our servers' },
];

export const DonationSection = () => {
  const [selectedAmount, setSelectedAmount] = useState(1500);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDonate = async () => {
    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;
    
    if (amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum donation is $1.00",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-donation', {
        body: { amount, donorName, donorEmail, message }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Support Our Development
        </CardTitle>
        <CardDescription>
          Help us build the best event discovery platform for Portland and beyond!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {donationAmounts.map(({ amount, label, icon: Icon, description }) => (
            <Button
              key={amount}
              variant={selectedAmount === amount ? "default" : "outline"}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className="h-16 flex flex-col gap-1"
            >
              <Icon className="h-4 w-4" />
              <span className="font-semibold">{label}</span>
              <span className="text-xs opacity-80">{description}</span>
            </Button>
          ))}
        </div>
        
        <div>
          <Input
            placeholder="Custom amount ($)"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(0);
            }}
            type="number"
            min="1"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Your name (optional)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
          />
          <Input
            placeholder="Email (optional)"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            type="email"
          />
        </div>

        <Textarea
          placeholder="Leave a message of support (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />

        <Button 
          onClick={handleDonate} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          size="lg"
        >
          {isLoading ? 'Processing...' : `Donate ${customAmount ? `$${customAmount}` : `$${selectedAmount / 100}`}`}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe. Your support helps us improve the platform for everyone!
        </p>
      </CardContent>
    </Card>
  );
};