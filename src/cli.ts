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
        const wallet = new Wallet(undefined, accountIndex);

        wallets[wallet.publicKey] = {
            mnemonic: wallet.mnemonic,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey
        };

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
            //console.log("Public key: \n", wallet.publicKey);
        } catch (error) {
            console.log("❌ Invalid Mnemonic. Please try again.");
        }
    }
}