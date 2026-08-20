let userScore = 0;
let computerScore =0;

const choices = document.querySelectorAll(".choice");
const Msg = document.querySelector("#Msg");
 
const userScorePara = document.querySelector("#User-Score");
const computerScorePara = document.querySelector("#Computer-Score");

const genCompChoice = () => {
   const options = ["rock", "paper", "scissors"];
    const randomIndex = Math.floor(Math.random() * 3);
    return options[randomIndex];
};
    const drawGame = () =>{
        console.log("It was a draw!");
        Msg.innerText = "Game was Draw. Play again";
        Msg.style.backgroundColor = "rgb(58, 58, 68)";
    };
   const showWinner = (userWin, userChoice, compChoice) => {
    if (userWin) {
        userScore++;
        userScorePara.innerText = userScore; 
        Msg.innerText = `You win: your ${userChoice} beats ${compChoice}`;
        Msg.style.backgroundColor = "green";
    } else {
        computerScore++;
        computerScorePara.innerText = computerScore;

        Msg.innerText = `You lost: ${compChoice} beats your ${userChoice}`;
        Msg.style.backgroundColor = "red";
    }

}

    // User Choice
const playGame = (userChoice) =>{
    console.log("User choice: ", userChoice);
    const compChoice = genCompChoice();

    // computer choice
    console.log("Computer choice: ", compChoice);
    console.log("Comp Choice:",compChoice);

    // Draw Game
    if(userChoice === compChoice){
        drawGame();
    }
    else{
        let userWin = true;
        if(userChoice === "rock")
        {
            userWin = compChoice === "paper" ? false : true;
        } 
        else if(userChoice === "paper"){
            userWin = compChoice === "scissors" ? false : true;
        } 
        else if(userChoice === "scissors"){
            userWin = compChoice === "rock" ? false : true;
        }
        showWinner(userWin, userChoice, compChoice);
    }

};
 choices.forEach((choice) => {
    choice.addEventListener("click", () => {
        const userChoice = choice.getAttribute("id");
        console.log("Choice was clicked: ", userChoice);
        playGame(userChoice);
    });
});