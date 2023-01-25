import { Alert, Button, Card, Col, Divider, Input, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import { Pie, Bar } from "@ant-design/plots";
import chainlinkABI from "./abi/priceABI.js";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  // useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import "./App.css";
import {
  Account,
  Address,
  Balance,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { getRPCPollTime, Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph } from "./views";
import { useStaticJsonRPC, useGasPrice } from "./hooks";
import { BigIntString } from "walletlink/dist/types";
const { ethers, BigNumber, FixedNumber } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

const getProvider = new ethers.providers.JsonRpcProvider("https://rpc.scaffoldeth.io:48544");

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers, localProvider);

  // Sensible pollTimes depending on the provider you are using
  const localProviderPollingTime = getRPCPollTime(localProvider);
  const mainnetProviderPollingTime = getRPCPollTime(mainnetProvider);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, mainnetProviderPollingTime);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "FastGasPrice", localProviderPollingTime);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, localProviderPollingTime);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address, mainnetProviderPollingTime);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(
    mainnetContracts,
    "DAI",
    "balanceOf",
    ["0x34aA3F359A9D614239015126635CE7732c18fDF3"],
    mainnetProviderPollingTime,
  );
  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:", addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    //const provider = await web3Modal.connect();
    const provider = await web3Modal.requestProvider();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    //automatically connect if it is a safe app
    const checkSafeApp = async () => {
      if (await web3Modal.isSafeApp()) {
        loadWeb3Modal();
      }
    };
    checkSafeApp();
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [YesbetAmount, setYesbetAmount] = useState({ valid: false, value: "" });
  const [Yesbetting, setYesBetting] = useState();

  const [NobetAmount, setNobetAmount] = useState({ valid: false, value: "" });
  const [Nobetting, setNoBetting] = useState();

  const weiValueToYesBets = YesbetAmount.valid && ethers.utils.parseEther("" + YesbetAmount.value);
  const weiValueToNoBets = NobetAmount.valid && ethers.utils.parseEther("" + NobetAmount.value);

  const YesbetsPerGambler = useContractReader(readContracts, "PredictionMarket", "betsPerGambler", [address, 0]);
  const NobetsPerGambler = useContractReader(readContracts, "PredictionMarket", "betsPerGambler", [address, 1]);
  let yesWon = useContractReader(readContracts, "PredictionMarket", "yeswon");
  console.log("yesWon", yesWon);

  const etherYesbetsPerGambler = parseInt(YesbetsPerGambler) / 1000000000000000000;
  const etherNobetsPerGambler = parseInt(NobetsPerGambler) / 1000000000000000000;

  const [betWithdrawAmount, setbetWithdrawAmount] = useState({ valid: false, value: "" });
  // console.log("betWithdrawAmount", betWithdrawAmount.value);

  const ethValueTowithdraw = parseInt(betWithdrawAmount) / 1000000000000000000;
  // console.log("ethValueToSellTokens:", ethValueTowithdraw);

  const [betWithdrawing, setbetWithdrawing] = useState();
  const [isWithdrawAmountApproved, setisWithdrawAmountApproved] = useState();

  useEffect(() => {
    const betWithdrawAmountBN = betWithdrawAmount.valid ? ethers.utils.parseEther("" + betWithdrawAmount.value) : 0;
    setisWithdrawAmountApproved(
      YesbetsPerGambler && betWithdrawAmount.value && YesbetsPerGambler.gte(betWithdrawAmountBN),
    );
  }, [betWithdrawAmount, readContracts]);

  const EventPie = () => {
    const yesBets = useContractReader(readContracts, "PredictionMarket", "bets", [0]);
    const noBets = useContractReader(readContracts, "PredictionMarket", "bets", [1]);
    const divisor = 1000000000000000000;
    const yesBetsInt = parseInt(yesBets) / divisor;
    const noBetsInt = parseInt(noBets) / divisor;
    const data = [
      {
        type: "Yes",
        value: yesBetsInt,
      },
      {
        type: "No",
        value: noBetsInt,
      },
    ];
    const config = {
      appendPadding: 10,
      data,
      angleField: "value",
      colorField: "type",
      radius: 0.75,
      label: {
        type: "spider",
        labelHeight: 28,
        content: "{name}\n{percentage}",
      },

      interactions: [
        {
          type: "element-selected",
        },
        {
          type: "element-active",
        },
      ],
    };
    return <Pie {...config} />;
  };

  const SIDE = {
    YES: 0,
    NO: 1,
  };

  const ChainlinkContractAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
  const ethPriceContract = new ethers.Contract(ChainlinkContractAddress, chainlinkABI, getProvider);
  const ETHdata = ethPriceContract.latestRoundData();

  const [ETHPrice, setETHPrice] = useState([]);

  useEffect(() => {
    async function getArray() {
      const data = await ETHdata;
      setETHPrice(data);
    }
    getArray();
  }, []);

  let ethPriceBN = (parseInt(ETHPrice[1]) / 100000000).toFixed(0);
  console.log("Current ETH price", ethPriceBN);

  // Match this with smart contract inputs for future ethprice and future timestamp
  const futurePriceofETH = 1500;
  const futureTimeStamp = 1674685832;

  const futureDate = new Date(futureTimeStamp * 1000);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const futureDay = futureDate.getUTCDate();
  const futureMonthName = monthNames[futureDate.getUTCMonth()];
  const futureYear = futureDate.getUTCFullYear();
  const today = Math.floor(Date.now() / 1000);
  let timeRemaining = ((futureTimeStamp - today) / 3600).toFixed(2);
  if (timeRemaining < 0) {
    timeRemaining = 0;
    yesWon = yesWon;
  } else {
    timeRemaining = timeRemaining;
    yesWon = null;
  }

  return (
    <div>
      <div>
        <Card style={{ padding: 8, marginTop: 50, width: 400, textAlign: "center", margin: "auto" }}>
          <h1>
            Will ETH price be more than {futurePriceofETH} USD by the end of {futureMonthName} {futureDay}, {futureYear}
            ?
          </h1>
          <div style={{ padding: 20 }}> </div>
          <h3 style={{ textAlign: "center", margin: "auto" }}> Current ETH Price is {ethPriceBN} USD </h3>
        </Card>
        <Divider></Divider>
        <Card style={{ marginTop: 20, width: 250, textAlign: "center", margin: "auto" }}>
          <h3 style={{ textAlign: "center", margin: "auto" }}> {timeRemaining} Hours Remaining</h3>
          <div style={{ padding: 8 }}> </div>
          <Button
            type={"primary"}
            onClick={async () => {
              await tx(writeContracts.PredictionMarket.reportResult());
            }}
          >
            Check Result!
          </Button>
          <div style={{ padding: 8 }}> </div>
          {yesWon !== null ? yesWon ? <p>Yes won!</p> : <p>No won!</p> : null}
        </Card>

        <Divider></Divider>
        <div>
          <div>
            <Card style={{ padding: 8, width: "20%", textAlign: "center", float: "left", left: 420 }}>
              <h2>Yes</h2>
              <Input
                placeholder="Bet amount (ETH)"
                value={YesbetAmount.value}
                onChange={e => {
                  const newValue = e.target.value.startsWith(".") ? "0." : e.target.value;
                  const YesbetAmount = {
                    value: newValue,
                    valid: /^\d*\.?\d+/.test(newValue),
                  };
                  setYesbetAmount(YesbetAmount);
                }}
              />
              <div style={{ padding: 8 }}></div>
              <Button
                type={"primary"}
                loading={Yesbetting}
                onClick={async () => {
                  setYesBetting(true);
                  await tx(writeContracts.PredictionMarket.placeBet(SIDE.YES, { value: weiValueToYesBets }));
                  setYesBetting(false);
                }}
                disabled={!YesbetAmount.valid}
              >
                Submit
              </Button>
            </Card>
          </div>

          <div>
            <Card style={{ padding: 8, width: "20%", textAlign: "center", float: "left", left: 420 }}>
              <h2>No</h2>
              <Input
                placeholder="Bet amount (ETH)"
                value={NobetAmount.value}
                onChange={e => {
                  const newValue = e.target.value.startsWith(".") ? "0." : e.target.value;
                  const NobetAmount = {
                    value: newValue,
                    valid: /^\d*\.?\d+/.test(newValue),
                  };
                  setNobetAmount(NobetAmount);
                }}
              />
              <div style={{ padding: 8 }}></div>
              <Button
                type={"primary"}
                loading={Nobetting}
                onClick={async () => {
                  setNoBetting(true);
                  await tx(writeContracts.PredictionMarket.placeBet(SIDE.NO, { value: weiValueToNoBets }));
                  setNoBetting(false);
                }}
                disabled={!NobetAmount.valid}
              >
                Submit
              </Button>
            </Card>
          </div>
        </div>
      </div>
      <div style={{ padding: 100 }}></div>

      <Divider></Divider>
      <div style={{ textAlign: "center" }}>
        <h2> Current Odds </h2>
        <EventPie />
      </div>

      <Divider></Divider>

      <Card style={{ padding: 2, width: "15%", textAlign: "center", margin: "auto" }}>
        <h2 style={{ textAlign: "center", margin: "auto" }}> My Yes Bets </h2>
        <h4 style={{ textAlign: "center", margin: "auto" }}> {etherYesbetsPerGambler} ETH </h4>
        <div style={{ padding: 10 }}> </div>
        <h2 style={{ textAlign: "center", margin: "auto" }}> My No Bets </h2>
        <h4 style={{ textAlign: "center", margin: "auto" }}> {etherNobetsPerGambler} ETH </h4>
        <div style={{ padding: 15 }}> </div>
        <div>
          <Button
            type={"primary"}
            onClick={async () => {
              await tx(writeContracts.PredictionMarket.withdrawGain());
            }}
          >
            Withdraw Bet
          </Button>
        </div>
      </Card>

      <Divider></Divider>

      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
      </div>

      {USE_NETWORK_SELECTOR && (
        <div style={{ marginRight: 20 }}>
          <NetworkSwitch
            networkOptions={networkOptions}
            selectedNetwork={selectedNetwork}
            setSelectedNetwork={setSelectedNetwork}
          />
        </div>
      )}

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
      <Contract
        name="PredictionMarket"
        price={price}
        signer={userSigner}
        provider={localProvider}
        address={address}
        blockExplorer={blockExplorer}
        contractConfig={contractConfig}
      />
    </div>
  );
}

export default App;
