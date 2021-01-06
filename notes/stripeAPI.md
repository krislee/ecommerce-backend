
Building an integration with the Payment Intents API involves two actions: creating and confirming a PaymentIntent. Each PaymentIntent typically correlates with a single shopping cart or customer session in your application. The PaymentIntent encapsulates details about the transaction, such as the supported payment methods, the amount to collect, and the desired currency.

# Payment Methods API
### What is Payment Methods API?
Use Payment Methods API to add payment methods.

The Payment Method object can be used with PaymentIntents to collect payments or saved to Customer objects to store instrument details for future payments.

# Setup Intents API
### What is Setup Intents API?
Use Setup Intents API to set future payments

# Payment Intents API 

## What is Payment Intents API?
Use Payment Intents API to make a payment

## What is a ``PaymentIntent``?
``PaymentIntent`` is an obj that tracks the process of collecting a payment from customer. You can keep track of the status of the process through the ``status`` attribute of ``PaymentIntent``.

## How to use Payment Intents API?

1. ### Create a ``PaymentIntent`` when the customer begins the checkout process. Each checkout has its own ``PaymentIntent`` (add the order id to ``metadata`` attribute and description on bank accounts to ``statement_descriptor`` attribute of ``PaymentIntent``).

- <b><i> [Add ``idempotency`` key as the value to the ``Idempotency-Key`` header or add ``idempotency`` key when creating ``PaymentIntent``](https://stripe.com/docs/idempotency) </b></i>
    - Idempotency is the ability to apply the same operation multiple times without changing the result beyond the first try.
    -  Including an ``idempotency`` key makes POST requests idempotent. Example: if a request to create a charge doesn’t respond because of a network connection error, a client can retry the request with the same idempotency key to guarantee that no more than one charge is created.
    - How idempotency works?
        1. Server checks if there is an ``Idempotency-Key`` header. 
        2. If it is present, then server checks the database to see if there is a record with that ``idempotency`` key.
        3. If there is a record, then any further code in the function stops running and will return that record already saved in the database as the response.
        4. If there is no record, then the middleware will create a new record in the database with the ``idempotency-key`` and the generated response. Then, the response is returned.
    - Create an ``idempotency`` key by using the ``uuid`` library or attach the ID of the shopping cart.
    - The key expires in 24hrs, so as long as the subsequent reattempt requests are made within the 24hrs.
    - Notes: 
        - The Stripe API guarantees the idempotency of GET and DELETE requests, so it’s always safe to retry them
        - Also, set ``Idempotent-Replayed`` header to ``true`` value to see a previously executed response

- <b><i> Update ``PaymentIntent`` </b></i>
    - If something about the ``PaymentIntent`` changes during the checkout process, i.e. customer backs out of the checkout process and adds new items to their cart, then you need to update the ``amount`` attribute in ``PaymentIntent``.

- <b><i> Store the ``PaymentIntent`` ID on the shopping cart </b></i>
    - Before a ``PaymentIntent`` is confirmed, if the checkout process is interrupted and resumes later, then reuse the same ``PaymentIntent`` instead of creating a new one. Each ``PaymentIntent`` has a unique ID that you can use to retrieve the ``PaymentIntent`` if you need it again. 

<br><br>

Once the ``PaymentIntent`` is created, the ``client_secret`` attribute value of ``PaymentIntent`` is passsed to the client. The ``client_secret`` represents the ``PaymentIntent`` object.

Client creates a payment method, entering payment information.

<br><br>

2. ### Confirm a ``PaymentIntent`` on client side (normally automatic and simultaneous when customer's payment information is sent): ``stripe.confirmCardPayment('client_secret')
    - Confirming a ``PaymentIntent`` abstracts the 3 charging card steps:
        1. 🕵️ Authentication - Card information is sent to the card issuer for verification. Some cards may require the cardholder to strongly authenticate the purchase through protocols like 3D Secure, so this causes the status of the ``PaymentIntent`` to be ``requires_action``

        2. 💁 Authorization - Funds from the customer's account are put on hold but not transferred to the merchant.

        3. 💸 Capture - Funds are transferred to the merchant's account and the payment is complete.

        - You can split Authorization and Capture steps to place a hold on a customer's card and capture later after a certain event. Set ``capture_method`` attribute in ``PaymentIntent`` to ``manual``. Note that funds must be captured within 7 days of authorizing the card or the PaymentIntent reverts back to a status of ``requires_payment_method``. If you want to charge a customer more than 7 days after collecting their card details, then save the card.

    [Status of ``PaymentIntent``](https://stripe.com/docs/payments/intents#intent-statuses)
<br><br>

Server monitors webhooks to detect when the payment completes successfully or fails.

## [Webhooks](https://stripe.com/docs/payments/handling-payment-events)

### [What is a Webhook?](https://stripe.com/docs/webhooks)
A webhook is an event, such as the payout of funds to your bank account, that triggers a URL aka endpoint, creating a reaction, such as an order can now be fulfilled.  In Stripe, the event with all the details of the event is stored in an ``event`` object. Stripe sends the ``event`` object in JSON format to the endpoint. The endpoint has a function that receives the JSON ``event`` object and executes a reaction, which includes first parsing the JSON ``event`` object into an ``event`` object, then depending on the type of the event, it has some code reaction, then finally return a 200 status which confirms receipt of the ``event`` object.

(A webhook is similar to an API but does not involve requests).

### When to use Webhook?
Use webhook in asynchronous events, meaning the events happen at a later time and not directly in response to your code's execution. 

Stripe events usually involves:
- Payment Intents API
- Subscriptions
- Notifications of payouts

### Examples of Webhook endpoint actions
- Updating a customer’s membership record in your database when a subscription payment succeeds
- Making adjustments to an invoice when it’s created (but before it’s been paid)
- Logging an accounting entry when a transfer is paid
- Indicating that an order can be fulfilled (i.e., boxed and shipped)


# To-Do
[] Make a webhook for the event ``payment_intent.succeeded``. The webhook endpoint will create an order in the database(?) or in Stripe dashboard??? and mark the order status as received. Order statuses: received, processing, shipped. The webhook endpoint will also capture the funds. Update order status on webhooks instead of in the client side because "it is possible for customers to leave the page after payment is complete but before the fulfillment process initiates".

For any important post-payment actions (such as shipping packages, sending email receipts) we recommend setting up a webhook

[] Make a webhook for the event ``payment_intent.requires_capture`` for waitlist items.