require("dotenv").config()
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

function generateKeyPairs(){
    
    // Generate public and private keys (from Node crypto documentation)
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096, // 4096 bits is standard for RSA keys
    publicKeyEncoding: {
        // type: 'spki',
        type: 'pkcs1',
        format: 'pem'
    },
    privateKeyEncoding: {
        // type: 'pkcs8',
        type: 'pkcs1',
        format: 'pem',
        // cipher: 'aes-256-cbc',
        // passphrase: 'topsecret'
    }
    });

     // Create  public key file
     fs.writeFileSync(__dirname + '/id_rsa_pub.pem', publicKey); 
    
     // Create private key file
     fs.writeFileSync(__dirname + '/id_rsa_priv.pem', privateKey);
 
}

// Run function to generate public and private keys
generateKeyPairs()


