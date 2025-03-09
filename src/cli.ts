import inquirer from "inquirer";
import * as readline from "readline-sync";
import { Wallet } from "./blockchain";
import fs from 'fs';

const databaseLocation = './src/database.json';

export const saveData = (data: object) => {
    fs.writeFileSync(databaseLocation, JSON.stringify(data, null, 2));
};

export const loadData = (): any => {
    if (!fs.existsSync(databaseLocation)) return { wallets: {}, blockchain: [] };
    return JSON.parse(fs.readFileSync(databaseLocation, 'utf-8'));
};

const data = loadData();
const wallets = data.wallets;

export class LogIn {

    private wallet: Wallet | null = null; // Store the logged-in wallet

    constructor() {
        console.log("Welcome to the blockchain!");

        this.firstMenu();
    }

    async firstMenu() {
        const choices = ["Sign In", "Log In", "Exit"];

        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "option",
                message: "Select an option:",
                choices: choices,
            },
        ]);

        console.log(`You selected ${answer.option}`);

        switch (answer.option) {
            case "Sign In":
                this.createWallet();
                break;
            case "Log In":
                this.loginWallet();
                break;
            case "Exit":
                console.log("Exiting...");
                process.exit(0);
        }
    }

    async createWallet() {
        const accountIndex = Object.keys(wallets).length; // Assign a unique index.
        const wallet = new Wallet(undefined, 0);

        wallets[wallet.publicKey] = {
            mnemonic: wallet.mnemonic,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey
        };

        // Initialize balance
        if (!data.balances) data.balances = {}; // Ensure balances exist
        data.balances[wallet.publicKey] = 100; // Give 100 Stash to new wallet

        saveData({ ...data, wallets });
        console.log("New wallet saved!");
        console.log("New wallet created!");
        console.log("Mnemonic (SAVE THIS!):", wallet.mnemonic);
        //console.log("Public key: \n", wallet.publicKey);
        this.loginWallet()
    }

    async loginWallet() {
        const mnemonic = readline.question("Enter your mnemonic phrase: ");
        const accountIndex = Object.keys(wallets).length; // Load next account.

        try {
            const wallet = new Wallet(mnemonic, accountIndex);
            wallets[wallet.publicKey] = wallet;
            console.log("Wallet loaded! \n")
            this.wallet = wallet; // Store the logged-in wallet
            await this.checkBalance(); //Will be subtituted by main menu.
        } catch (error) {
            console.log("❌ Invalid Mnemonic. Please try again.");
        }
    }

    async checkBalance() {
        if (!this.wallet) {
            console.log("❌ No wallet is currently logged in.");
            return;
        }

        const data = loadData();
        console.log("Stored Balances:", JSON.stringify(data.balances, null, 2)); // Debugging

        const balance = data.balances[this.wallet.publicKey] || 0;
        console.log(`💰 Balance for \n ${this.wallet.publicKey} ${balance} Stash`);
    }
}