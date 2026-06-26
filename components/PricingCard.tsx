'use client';

import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCta?: () => void;
}

export default function PricingCard({ name, price, period, features, highlighted, cta, onCta }: PricingCardProps) {
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col ${highlighted ? 'border-brand-gold bg-brand-navy text-white shadow-xl scale-105' : 'border-brand-sand/30 bg-white text-brand-navy'}`}>
      <h3 className="font-heading text-lg mb-1">{name}</h3>
      <div className="mb-6">
        <span className="font-heading text-3xl font-bold">{price}</span>
        <span className="font-body text-sm opacity-60 ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 font-body text-sm">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-brand-gold' : 'text-brand-forest'}`} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={`w-full py-2.5 rounded-xl font-body text-sm font-medium transition-colors ${
          highlighted
            ? 'bg-brand-gold text-brand-navy hover:bg-brand-gold/90'
            : 'border border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
