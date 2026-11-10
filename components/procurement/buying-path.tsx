const steps = [
  { title: 'Select', detail: 'Pick a specification and a quantity.' },
  { title: 'Hotel list', detail: 'The same list opens in the hotel workspace.' },
  { title: 'Sealed requests', detail: 'Each line is requested without showing vendors to each other.' },
  { title: 'Approved order', detail: 'A purchase order exists only after the hotel approves a response.' },
  { title: 'External funding', detail: 'A funder may finance the invoice. HotelsVendors does not lend or hold a credit balance.' },
];

export function BuyingPath() {
  return <ol className="buying-path" aria-label="How a hotel buys">
    {steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><strong>{step.title}</strong><small>{step.detail}</small></li>)}
  </ol>;
}
