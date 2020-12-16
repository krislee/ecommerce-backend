
Building an integration with the Payment Intents API involves two actions: creating and confirming a PaymentIntent. Each PaymentIntent typically correlates with a single shopping cart or customer session in your application. The PaymentIntent encapsulates details about the transaction, such as the supported payment methods, the amount to collect, and the desired currency.

# Payment Methods API
### What is Payment Methods API?
Use Payment Methods API to add payment methods

# Setup Intents API
### What is Setup Intents API?
Use Setup Intents API to set future payments

# Payment Intents API 
### What is Payment Intents API?
Use Payment Intents API to make a payment

### What is a ``PaymentIntent``?
``PaymentIntent`` is an obj that tracks the process of collecting a payment from customer. You can keep track of the status of the process through the ``status`` attribute of ``PaymentIntent``.

### How to use Payment Intents API?
1. Create a ``PaymentIntent`` when the customer begins the checkout process. Each checkout has its own ``PaymentIntent``. 

- Add ``idempotency`` key when creating ``PaymentIntent``

- Update ``PaymentIntent``
    - If something about the ``PaymentIntent`` changes during the checkout process, i.e. customer backs out of the checkout process and adds new items to their cart, then you need to update the ``amount`` attribute in ``PaymentIntent``.

- Store the ``PaymentIntent`` ID on the shopping cart
    - Before a ``PaymentIntent`` is confirmed, if the checkout process is interrupted and resumes later, then reuse the same ``PaymentIntent`` instead of creating a new one. Each ``PaymentIntent`` has a unique ID that you can use to retrieve the ``PaymentIntent`` if you need it again. 

2. Confirm a ``PaymentIntent``:
    - Confirming a ``PaymentIntent`` abstracts the 3 charging card steps:
        1. 🕵️ Authentication - Card information is sent to the card issuer for verification. Some cards may require the cardholder to strongly authenticate the purchase through protocols like 3D Secure.

        2. 💁 Authorization - Funds from the customer's account are put on hold but not transferred to the merchant.

        3. 💸 Capture - Funds are transferred to the merchant's account and the payment is complete.

        - You can split Authorization and Capture steps to place a hold on a customer's card and capture later after a certain event. Set ``capture_method`` attribute in ``PaymentIntent`` to ``manual``. Note that funds must be captured within 7 days of authorizing the card or the PaymentIntent reverts back to a status of ``requires_payment_method``. If you want to charge a customer more than 7 days after collecting their card details, then save the card.

        