## Steps ##

<ins>Frontend </ins>

1. When customer enters cc information, it sends that information to Stripe.

<ins>Stripe</ins>

2. Stripe takes the information, parses it, checks the card details are formatted correctly (i.e. the expiry date is not in the past) but does not check if the card itself is valid yet, and sends the info back to the frontend as a unique token ID. 

<ins>Frontend</ins>

3. The token ID is sent back to the server from the frontend.

<ins> Server</ins>

3. The unique ID is what the server will use to reference to the customer's cc information. This allows us to not store the customer's cc information on the server. The server only stores the ID. 
4. Stripe's secret key will then allow the server to tell Stripe to charge using the information from the ID.

<ins>Stripe</ins>

*Authorization*
5. After charge, the customer's bank will check if the customer has enough funds. If there are enough funds, the payment is authorized so the bank guarantees the amount on the customer's account is held for the merchant (marked as pending).

*Capture*
6. The money moves from the customer's bank to merchant's account.
- Authorized payments can only be captured once. If you partially capture a payment, you cannot perform another capture for the difference so you may want to save a customer's card for future captures. 


Make Payment Intent: an obj that tracks the process of collecting a payment from customer --> Authorize only --> after card is authorized, capture the funds (uncaptured payment intents are canceled 7 days after created) after order is being prepared - if out of stock, amount_to_capture is less than the total authorized amount 

when clicking preparing order on the seller side, then {await stripe.paymentItents.capture()} & then when clicking on ship button do payment_intent_ship_status = true 
If the order was not completed (clicked purchased and then exited the window)

Email receipt by adding receipt_email param when creating payment intent (receipt_email: "email@email.com")
capture_method: manual
customer: customer_id (customer_id generated after creating customer)
cofirmation_method: automatic --> allows payment intent to be confirmed using a publishable key
confirmation_method: manual --> payment intent made using a secret key --> requires_confirmation status --> server confirms 

If updating payment intent do it through confirm API to update and confirm at the same time --> update payment intent shipping tracking number

Confirm payment intent --> status changes to requires_payment_method (if payment fails), succeeded, or requires_capture 

if(last_payment_error) {}

confirmation_method: manual ???


<ins>Payment Intents</ins>

- Create exactly one PaymentIntent for each order or customer session in your system. You can reference the PaymentIntent later to see the history of payment attempts for a particular session.
- A PaymentIntent transitions through multiple statuses throughout its lifetime as it interfaces with Stripe.js to perform authentication flows and <b>ultimately creates at most one successful charge</b>.

<ins>PaymentIntents Attributes</ins>

- ``amount``: the amount intended to be collected by this PaymentIntent
- ``charges.data``: list shows the latest charge, even if there were previously multiple unsuccessful charges
- ``charges.url``: use this URL to view all previous charges for a PaymentIntent
- ``client_secret``: used to complete a payment from your frontend. It should not be stored, logged, embedded in URLs, or exposed to anyone other than the customer. Make sure that you have TLS enabled on any page that includes the client secret
- ``payment_method``: ID of the payment method used in this PaymentIntent
- ``payment_method_types``: the list of payment method types (e.g. card) that this PaymentIntent is allowed to use.
- ``setup_future_usage``: indicates that you intend to make future payments with this PaymentIntent’s payment method, so the payment method will be attached to the PaymentIntent’s Customer, if present, after the PaymentIntent is confirmed and any required actions from the user are complete. If no Customer was provided, the payment method can still be attached to a Customer after the transaction completes.
- ``shipping``: shipping information for this PaymentIntent
- ``statement_descriptor_suffix``: provides information about a card payment that customers see on their statements
- ``capture_method``:
    - ``automatic``(default): automatically captures funds when the customer authorizes the payment
    - ``manual``: place a hold on the funds when the customer authorizes the payment for up to 7 days, but don’t capture the funds until later (separating authorization and capturing funds)
- ``status``: 
    - ``requires_payment_method``: When the PaymentIntent is created, it has a status of ``requires_payment_method`` until a payment method is attached. It is recommended to create the PaymentIntent as soon as you know how much you want to charge, so that Stripe can record all the attempted payments.
    - ``processing``
    - ``requires_capture``: If ``capture_method`` is ``manual``, then after the card is authorized, the ``PaymentIntent status`` is ``requires_capture``. To capture the the authorized funds, make a PaymentIntent capture request: ``await stripe.paymentIntents.capture('publishableKey', {options})``. To capture less than the initial amount, pass the ``amount_to_capture`` option. Authorized payments can only be captured once. If you partially capture a payment, you cannot perform another capture for the difference. Depending on your requirements, you may be better served by saving customer’s card details for later and creating future payments as needed.
    - ``succeeded`` or ``requires_payment_method`` or ``canceled``:
        1. ``succeeded``: Means that the payment flow it is driving is complete. The funds are now in your account and you can confidently fulfill the order.
        2. ``requires_payment_method``: If the payment attempt fails (for example due to a decline), the PaymentIntent's status returns to requires_payment_method
        3. ``canceled``: You may cancel a PaymentIntent at any point before it is ``processing`` or ``succeeded``. This invalidates the PaymentIntent for future payment attempts, and cannot be undone. If any funds have been held, cancellation returns those funds

1. Create a PaymentIntent object.
2. Attach a payment method and confirm to continue the payment. When confirm=true is used during creation, it is equivalent to creating and confirming the PaymentIntent in the same call. You may use any parameters available in the confirm API when confirm=true is supplied.

# Charging A Card Steps:
1. 🕵️ Authentication - Card information is sent to the card issuer for verification. Some cards may require the cardholder to strongly authenticate the purchase through protocols like 3D Secure.

2. 💁 Authorization - Funds from the customer's account are put on hold but not transferred to the merchant.

3. 💸 Capture - Funds are transferred to the merchant's account and the payment is complete.

The Payment Intents API abstracts away these three stages by handling all steps of the process through the ``confirm method``. 

# <ins>TODO</ins>

During Payment:
- [ ] Save cc in case you captured only a partial payment, and need to capture the other partial payment
- [x] Save cc so user do not need to enter cc info when checking out

After Payment:
- Refunds 
- Receipt


How does stripe check if sufficient funds on card? Or if it is the right card details?
