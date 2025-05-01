import React, { useState } from 'react';
import { 
  CardElement,
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  language = 'en'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);

  const translations = {
    en: {
      processing: 'Processing...',
      donate: 'Donate $',
      cardError: 'Card error: ',
      completeFields: 'Please complete all fields'
    },
    es: {
      processing: 'Procesando...',
      donate: 'Donar $',
      cardError: 'Error de tarjeta: ',
      completeFields: 'Por favor complete todos los campos'
    },
    zh: {
      processing: '处理中...',
      donate: '捐赠 $',
      cardError: '卡片错误: ',
      completeFields: '请完成所有字段'
    },
    hi: {
      processing: 'प्रोसेसिंग...',
      donate: 'दान करें $',
      cardError: 'कार्ड त्रुटि: ',
      completeFields: 'कृपया सभी फ़ील्ड पूरा करें'
    },
    ar: {
      processing: 'جاري المعالجة...',
      donate: 'تبرع $',
      cardError: 'خطأ في البطاقة: ',
      completeFields: 'يرجى إكمال جميع الحقول'
    }
  };

  const t = translations[language];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError(t.completeFields);
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    // Create a payment method using the card element
    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error(t.completeFields);
      }

      // Create payment method with card element
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error || !paymentMethod) {
        throw error || new Error(t.completeFields);
      }

      // Process payment with your backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          description: 'DEICER Donation'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      // Handle successful payment
      onSuccess();
    } catch (err) {
      console.error('Payment error:', err);
      if (err instanceof Error) {
        setCardError(err.message);
        onError(t.cardError + err.message);
      } else {
        onError('An unexpected error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Card element options
  const cardElementOptions = {
    style: {
      base: {
        color: 'white',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        lineHeight: '1.5',
        '::placeholder': {
          color: '#9ca3af'
        }
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444'
      }
    },
    hidePostalCode: true,
    // Add credit card specific attributes for mobile devices
    autocomplete: 'cc-number'
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">
          {language === 'es' ? 'Número de Tarjeta' : 
           language === 'zh' ? '卡号' : 
           language === 'hi' ? 'कार्ड नंबर' : 
           language === 'ar' ? 'رقم البطاقة' : 
           'Card Number'}
        </label>
        <div 
          className="p-4 bg-gray-700 border border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-transparent"
          data-card-element="true"
        >
          <CardElement options={cardElementOptions} />
        </div>
        {cardError && (
          <div className="mt-2 text-red-400 text-sm">
            {cardError}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin mr-2" />
            {t.processing}
          </>
        ) : amount ? (
          <>{t.donate}{amount}</>
        ) : (
          <>{t.donate}0</>
        )}
      </button>
    </form>
  );
};

export default StripePaymentForm;