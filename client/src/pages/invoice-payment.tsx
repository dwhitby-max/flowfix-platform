import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Invoice } from '@shared/schema';
import { getErrorMessage } from '@shared/schema';
import { Loader2 } from 'lucide-react';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client-dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully!",
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

export default function InvoicePayment() {
  const [, params] = useRoute('/invoice/:id/pay');
  const invoiceId = params?.id || '';
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentSetupError, setPaymentSetupError] = useState<string>('');

  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<Invoice>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: !!invoiceId,
  });

  useEffect(() => {
    if (!invoiceId) return;

    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', `/api/invoices/${invoiceId}/create-payment-intent`, {});
        const data = await response.json();

        if (data.requiresSetup) {
          setPaymentSetupError(data.error || 'Payment processing is not configured');
          return;
        }

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Error",
            description: "Failed to initialize payment",
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setPaymentSetupError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [invoiceId, toast]);

  if (isLoadingInvoice) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-invoice" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              The invoice you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Already Paid</CardTitle>
            <CardDescription>
              This invoice has already been paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'recently'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/client-dashboard'} data-testid="button-return-dashboard">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Payment</CardTitle>
          <CardDescription>
            Complete your payment to proceed with the project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-muted-foreground">Invoice ID:</span>
            <span className="font-mono text-sm" data-testid="text-invoice-id">{invoice.id}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-muted-foreground">Amount:</span>
            <span className="text-2xl font-bold" data-testid="text-invoice-amount">
              ${(invoice.amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-muted-foreground">Status:</span>
            <span className="capitalize" data-testid="text-invoice-status">{invoice.status}</span>
          </div>
        </CardContent>
      </Card>

      {paymentSetupError ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment Not Available</CardTitle>
            <CardDescription className="text-destructive">
              {paymentSetupError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Payment processing requires configuration. Please contact support for assistance.
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Required Configuration:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>STRIPE_SECRET_KEY (backend)</li>
                <li>VITE_STRIPE_PUBLIC_KEY (frontend)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : !stripePromise ? (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Not Configured</CardTitle>
            <CardDescription>
              Payment processing requires Stripe configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The VITE_STRIPE_PUBLIC_KEY environment variable is not set. Please contact support.
            </p>
          </CardContent>
        </Card>
      ) : !clientSecret ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-payment" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Enter your payment information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm invoiceId={invoiceId} />
            </Elements>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
