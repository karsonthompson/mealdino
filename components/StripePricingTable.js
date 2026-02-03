'use client';

import Script from 'next/script';

const DEFAULT_PRICING_TABLE_ID = 'prctbl_1SvTMvIR4SeYj2NS8NcW4n0x';
const DEFAULT_PUBLISHABLE_KEY =
  'pk_test_51SpHnqIR4SeYj2NSoka6Q2rlznyGeIMZ5Bicy8AqGPDnCGW2PdIftklJ4nGaVbKc5zQjEFVOBzrQh8hEXbGt7muc00NJeLgPlc';

export default function StripePricingTable({
  pricingTableId = DEFAULT_PRICING_TABLE_ID,
  publishableKey = DEFAULT_PUBLISHABLE_KEY,
  customerEmail,
  clientReferenceId,
}) {
  const tableProps = {
    'pricing-table-id': pricingTableId,
    'publishable-key': publishableKey,
  };

  if (customerEmail) {
    tableProps['customer-email'] = customerEmail;
  }

  if (clientReferenceId) {
    tableProps['client-reference-id'] = clientReferenceId;
  }

  return (
    <div className="w-full">
      <Script async src="https://js.stripe.com/v3/pricing-table.js" />
      <stripe-pricing-table {...tableProps} />
    </div>
  );
}
