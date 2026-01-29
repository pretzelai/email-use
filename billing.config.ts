import type { BillingConfig } from "stripe-no-webhooks";

const billingConfig: BillingConfig = {
  test: {
    plans: [
      {
        id: "prod_Toy5ensoQwXqx3",
        name: "Free",
        price: [
          {
            id: "price_1SrK98HCmBUXufFCHjLiSvMi",
            amount: 0,
            currency: "usd",
            interval: "month",
          },
        ],
        features: {
          email_processing: {
            displayName: "Emails",
            credits: { allocation: 10000 },
          },
        },
      },
    ],
  },
  production: {
    plans: [],
  },
};

export default billingConfig;
