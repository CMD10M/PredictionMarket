# PredictionMarket

The Prediction Market allows users to place bets on a specific event with a yes or no outcome. The event's outcome is determined by the price of Ether (ETH) at a specified timestamp in the future, which is set by the "futureTimeStamp" variable. The price of ETH is obtained from the Chainlink price feeds smart contract through the "latestRoundData" function.

Users can place bets by calling the "placeBet" function and specifying whether they want to bet on "Yes" or "No". The value of their bet is specified in the "msg.value" variable, which is the amount of Ether sent with the function call. The bets are stored in the "bets" and "betsPerGambler" mappings, where the latter keeps track of the bets of each user.

Once the specified timestamp has passed, the "reportResult" function can be called to determine the outcome of the event. The function compares the price of ETH obtained from the "Chainlink" contract with the "futureEthPrice" variable. If the price of ETH is higher than "futureEthPrice", "Yes" wins, if it's lower, "No" wins.

Users can then call the "withdrawGain" function to retrieve their winnings. The function calculates the user's gain as their proportion of the winning bets, multiplied by the losers bets, plus their initial bet. The user's bets in the "betsPerGambler" mapping are then deleted, and the winnings are sent to the user's address.

The contract also has a "getTimestamp" function that returns the current block timestamp, and "getPrice" function which returns the current Ether price by calling the "latestRoundData" function from the Chainlink contract.

<a href="https://ibb.co/HnBfGdn"><img src="https://i.ibb.co/xJXtzHJ/Prediction-Market.png" alt="Prediction-Market" border="0" /></a>

# Instructions

🏄‍♂️ Quick Start
Prerequisites: Node (v16 LTS) plus Yarn and Git

clone/fork this repo

install the project dependencies and start your 👷‍ Hardhat chain:

yarn install
yarn chain
Copy packages/react-app/.sample.env to packages/react-app/.env and set the env vars.

in a second terminal window, start your 📱 frontend:

yarn start

Install the additional dependency in the packages/react-app/src folder - ant-design charts (npm install @ant-design/charts --save)

📝 Edit your frontend App.jsx in packages/react-app/src

Change the future ETH price to bet on (line 16 in PredictionMarket.sol & line 358 in app.jsx file)

Change the future date for which you want the bet to finish in unix time (line 17 in PredictionMarket.sol & line 359 in app.jsx file)

📱 Open http://localhost:3000 to see the Prediction Market

