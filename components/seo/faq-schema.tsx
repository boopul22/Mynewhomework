import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export const FAQSchema: React.FC<FAQSchemaProps> = ({ items }) => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
};

// Example usage:
/*
const faqs = [
  {
    question: "How do I track my assignments?",
    answer: "You can track your assignments through the dashboard by clicking on the 'Assignments' tab."
  },
  {
    question: "Can I set reminders for due dates?",
    answer: "Yes, you can set reminders for assignment due dates by clicking the bell icon next to any assignment."
  }
];

<FAQSchema items={faqs} />
*/ 