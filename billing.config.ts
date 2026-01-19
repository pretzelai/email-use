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
        credits: {
          email_processing: {
            allocation: 10000,
            displayName: "Email Credits",
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
