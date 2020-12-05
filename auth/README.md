# Install npm modules
``npm i passport``
``npm i passport-jwt``

# Asymmetric Cryptography 
Elecommerce application applies asymmetric cryptography for customer's authentication. When a customer registers or logs in to his/her account, ``jwt.sign()`` from the ``jwonwebtoken`` library is invoked to issue a JWT to the signed in customer. 

<ins> Behind the Scenes of ```jwt.sign()```:</ins>
1. base64url encode the payload
2. Use the ``sha256`` function from the ``RS256`` algorithm provided to ``jwt.sign()`` to hash the base64url-encoded payload 
3. ``jwt.sign()`` auto creates a hashed, base64url-encoded header
4. Load the hashed header, hashed payload, and private key to create signature, so the hashed data is signed
5. Combine base64url-encoded hashed header (from step 3), base64url-encoded hashed payload (from step 2), and signature (from step 4) to create JWT

The ``sha256`` function is a type of trap door function. It hashes the input data, creating a hash. A hash is deterministic, unique, and small data outcome. Since ``sha256 is 
ECM mathematically links the public key to private key so we can check if a public key corresponds to a private key without revealing the private key.
Sender signs the hashed data
Receiver verifies the signed data has not been tampered and is from the expected sender
use public key to decrypt hashed data - if this works, then we know it is from the expected sender
hash original data with ``sha256`` hash function
compare the decrypted hashed data and the manual hashed data to - if comparison matches, then we know data has not been tampered

RSA-SHA256
- sha256 hashes the header and payload 
- RSA means uses RSA's public and private key




jsonwebtoken library ``jwt.verify()``
1. We break down JWT and load the base64url encoded header and payload
2. sha356 hashes the header and payload
3. Then we load the public key and JWT signature to use public key to decrypt the signature to get a hashed header and hashed payload
4. compares the hashed header and payload from step 2 with the hashed header and payload from step 3 to return a boolean

Passport JWT strategy uses the jsonwebtoken library ``jwt.verify()`` to verify the JWT, and then calls the calls the callback function