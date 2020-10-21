**Authorization and Authentication Logic Using Asymmetric Crypto** <br>
1) Client logs in to application with username and password on browser
2) Server checks if the credentials are valid and looks up the user to see if who it says it is is true (authentication - will use passport for this)
3) If authenticated, server creates, or issues a JWT with the signature (encoded). The JWT is signed using the server's private key (only the server has the private key). 
4) Server gives the JWT to client
5) Client receives the JWT and can keep it on local storage or on a cookie. 
6) Client attaches the JWT (encoded) on all requests 
7) Server verifies the JWT signature with its public key. If the signature is valid meaning 1) it is coming from the user we have authenticated and 2) the JWT has not been tampered, then the server decodes the JWT from base64URL format (encoded) to JSON format (decoded). 
8) In the JSON format of the JWT, there will be the user in the payload.sub so the server looks the user up in the database from payload.sub and stores the user obj in the request obj and then uses it in routes

**Hash and Sign Data** <br>
The algo used dictates asymmetric or symmetric crypto and the hashing function for the digital signature. The hashing function takes data of any length and compress it to a deterministic, fixed-length short string aka hash. Deterministic hash means that the hash function will always return the same hash if you put in the same data. The hash function will always return different hashes for different data. The hashing function is also one-way going from data to hash and not hash to data. Elliptic Curve Multiplication (ECM) is used to mathematically link the private and public keys. The ECM is also one-way where you derive a public key from private key but not a private key from the public key, so you can share the public key to anyone and no one would figure out the private key. 

After hashing and signing the original data you want to send over, you need to send the following object to the receiver:

```javascript
pacakgeOfDataToSend = {
    ago: algo
    originalData: originalData // data does not have signature & is not hashed
    signedAndEncryptedData: signedHashedData // data is hashed & has signature
}
```
The receiver needs to verify that the data is not tampered and the sender is from who we expect it to be. To do so, we decrypt the ```signedHashData``` in ```packageOfDataToSend.signedAndEncryptedData``` with the public key provided to us. After decrypting, we will get the hash value of the original data (without the signature). 
Then, hash the ```originalData``` in ```packageOfDataToSend.originalData``` to compare the hash of ```packageOfDataToSend.originalData``` to the decrypted ```packageOfDataToSend.signedAndEncryptedData```. If the two are the same, then the data is not tampered and the signature is from the sender.

However, the ```packageOfDataToSend``` is too large to transport over the internet, slowing down web search. So we want to represent ```packageOfDataToSend``` in a smaller form just like when we hash the ```originalData``` and ***then*** signed the hashed version of the ```originalData```. So that is why we send a compact JWT token that contains the algo (header), original data (payload), and the signature - but this time we are not resending the hashed data with signature, just the signature itself(?)

**Examples of Asymmetric Crypto Uses** <br>
[Source](https://securityboulevard.com/2020/06/when-to-use-symmetric-vs-asymmetric-encryption-keyfactor/)<br><br>
**Encryption of Data** <br>
Alice wants to send a private message to Bob
Bob shares his public key with Alice
Alice encrypts the message with public key
Alice sends the message
Bob decrypts the message with private key
    - Since the message can only be decrypted with a private key, only Bob can read the encrypted message


**Digital Signature** <br>
Bob wants to send a message with a digital signature to Alice so she can verify it was Bob who send the message
Bob encrypts the signature with his private key
Bob sends the message
Alice receives the message
Alice uses the public key to verify Bob sent the message AND that the message was not modified (if message gets modified, the verification will fail - why??)


It’s important to note that all of these examples are one-way. To reverse any of them (e.g. so Bob can send private messages to Alice and Alice can send messages to Bob that contain her digital signature), Alice needs her own private key and must share the corresponding public key with Bob

