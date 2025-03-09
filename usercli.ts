import inquirer from "inquirer";

export class UserCli {
    constructor() {
        console.log("Welcome to the blockchain!");

        this.showMenu();
    }

    async showMenu() {
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
                this.signIn();
                break;
            case "Log In":
                this.logIn();
                break;
            case "Exit":
                console.log("Exiting...");
                process.exit(0);
        }
    }

    async signIn() {
        console.log("Signingin")
    }

    async logIn() {
        console.log("logingin")
    }
}