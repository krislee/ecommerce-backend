## Install npm modules
``npm i passport``
``npm i passport-jwt``

## Asymmetric Cryptography 
Elecommerce application applies asymmetric cryptography for customer's authentication. Asymmetric cryptography involves a private key and public key. 
Elliptic Curve Multiplication(ECM) is used to derive the public key from the private key by multiplication. Since ECM is also a type of trap-door function, it is a one-way function so you cannot derive the private key from the public key. Therefore, since ECM mathematically links the public key to private key, we can check if a public key corresponds to a private key without revealing the private key.

## Issue JWT
When a customer registers or logs in to his/her account, ``jwt.sign()`` from the ``jwonwebtoken`` library is invoked to issue a JWT to the signed in customer. 

<ins> Behind the Scenes of ```jwt.sign()```:</ins>
1. base64url encode the payload
2. Use the ``sha256`` function from the ``RS256`` algorithm provided to ``jwt.sign()`` to hash the base64url-encoded payload. The ``sha256`` function is a type of trap-door function. It hashes the input data, creating a hash. A hash is deterministic, unique, and small data outcome. 
3. ``jwt.sign()`` auto creates a hashed, base64url-encoded header
4. Load the hashed, base64url-encoded header, hashed, base64url-encoded payload, and private key to create signature, so the hashed data is signed
5. Combine base64url-encoded hashed header (from step 3), base64url-encoded hashed payload (from step 2), and signature (from step 4) to create JWT

## Verify JWT
The ``passport`` JWT strategy uses the ``jsonwebtoken`` library ``jwt.verify()`` to verify the JWT, and then calls the callback function: ``new JWTStrategy(options, callback)``. The payload object is passed from ``jwt.verify()`` to the callback function. Using ``payload.sub``, the user mongo document is found and stored in the ``req.user`` object. The ``req.user`` object is accessible to next middleware functions.

<ins> Behind the Scenes of ``jwt.verify()``:</ins>
1. Breakdown JWT into a base64url-encoded header, base64url-encoded payload, and digital signature
2. Load the base64url-encoded header and base64url-encoded payload
3. ``sha256`` hashes the base64url-encoded header and base64url-encoded payload (manual hashing the base64url-encoded header and payload)
4. Load the public key and JWT signature. The public key is used to decrypt the signature, returning a hashed, base64url-encoded header and hashed, base64url-encoded payload if the public key is correct.
5. Compare the hashed, base64url-encoded header and hashed, base64url-encoded payload (from step 3) to the decrypted hashed, base64url-encoded header and hashed, base64url-encoded payload (returned from step 4). If there is a match, then payload is returned to ``passport`` callback. If there is a mismatch, then an error and undefined payload is returned to ``passport`` callback. 

In the case of using ``passport``, if there is a mismatch, then it will return ``Unauthorized``.

By using the public key to decrypt the JWT, you will know if 
1. the JWT was issued from the expected sender since the public key can only decrypt a private key that corresponds to the public key  
2. the JWT has been tampered since the hashed, base64url-encoded header and payload returned from decrypting is compared to manual hashed, base64url-encoded header and payload

STEP 2:
JWT = header.payload.signature

MANUAL HASH: sha256 algo on (header + payload) --> hashed (header+payload)
PUBLIC KEY: DECRYPTS( header.payload.signature ) --> hashed (header+payload)