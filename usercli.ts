import inquirer from "inquirer";
import * as readline from "readline-sync";
import { Wallet } from "./blockchain";

const wallets: { [address: string]: Wallet } = {}; // Store wallets in memory.

export class UserCli {
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

        wallets[wallet.publicKey] = wallet;
        console.log("New wallet created!");
        console.log("Mnemonic (SAVE THIS!):", wallet.mnemonic);
        console.log("Public Key:", wallet.publicKey);
    }

    async loginWallet() {
        const mnemonic = readline.question("Enter your mnemonic phrase: ");
        const accountIndex = Object.keys(wallets).length; // Load next account.

        try {
            const wallet = new Wallet(mnemonic, accountIndex);
            wallets[wallet.publicKey] = wallet;
            console.log("Wallet loaded! \n")
            console.log("Public key: \n", wallet.publicKey);
        } catch (error) {
            console.log("❌ Invalid Mnemonic. Please try again.");
        }
    }
}