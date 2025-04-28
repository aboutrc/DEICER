export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: StripeProduct[] = [
  {
    priceId: 'price_1RIlHUEXnGXNAiw3Pij7Ez34',
    name: 'DEICER Donation',
    description: 'Donation to support development of the DEICER site as well as other tools to help individuals under attack in this administration.',
    mode: 'payment'
  }
];