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