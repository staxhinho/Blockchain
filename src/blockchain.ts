import * as bip39 from 'bip39';
import * as crypto from 'crypto';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { loadData, saveData } from './cli';

const bip32 = BIP32Factory(ecc);

export class Transaction {
    constructor(
        public amount: number,
        public payer: string, //public key - Payer
        public payee: string, //public key - Reciever
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}

export class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string | null,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

export class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('🔨 mining...');

        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substring(0,4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }

    addBlock(transaction: Transaction, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(transaction.payer, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

export class Wallet {
    public publicKey: string;
    public privateKey: string;
    public mnemonic: string;

    constructor(mnemonic?: string, accountIndex: number = 0) {
        if (mnemonic) {
            //Restore wallet from existing mnemonic.
            this.mnemonic = mnemonic;
        } else {
            //Generate a new mnemonic.
            this.mnemonic = bip39.generateMnemonic();
        }

        //Create HD wallet seed.
        const seed = bip39.mnemonicToSeedSync(this.mnemonic);
        const root = bip32.fromSeed(seed); //Not working

        // Derive account-specific key (BIP44 path: m/44'/0'/accountIndex').
        const account = root.derivePath(`m/44'/0'/${accountIndex}'`);
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const data = loadData();

        //Check if sender exists in balance records.
        if (!data.balances[this.publicKey]) {
            console.log("❌ Sender wallet does not exist in balance records.");
            return;
        }

        // Check if sender has enough Stash.
        if (data.balances[this.publicKey] < amount) {
            console.log("❌ Insufficient balance.");
            return;
        }

        // Deduct balance from sender.
        data.balances[this.publicKey] -= amount;

        // Add balance to recipient (initialize if not present).
        if (!data.balances[payeePublicKey]) {
            data.balances[payeePublicKey] = 0;
        }
        data.balances[payeePublicKey] += amount;

        // Create transaction and add to the blockchain
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);

        Chain.instance.addBlock(transaction, signature);

        // Save updated balances
        saveData(data);

        console.log(`✅ Sent ${amount} Stash to ${payeePublicKey}.`);
        console.log(`New Balance: ${data.balances[this.publicKey]} Stash`);
    }
}