import React, { useEffect, useState } from 'react';
import './App.css';
import SelectCharacter from './Components/SelectCharacter';
import twitterLogo from './assets/twitter-logo.svg';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import myEpicGame from './utils/MyEpicGame.json';
import { ethers } from 'ethers';
import Arena from './Components/Arena';
import LoadingIndicator from './Components/LoadingIndicator';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectCharacterProp, setSelectCharacterProp] = useState(null);
  const [viewSelectCharacter, setViewSelectCharacter] = useState(false);
  const [buttonReturn, setButtonReturn] = useState(null);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        setIsLoading(false);
        return;
      } else {
        console.log('We have the ethereum object', ethereum);

        const accounts = await ethereum.request({ method: 'eth_accounts' });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('Found an authorized account:', account);
          setCurrentAccount(account);
        } else {
          console.log('No authorized account found');
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const showMintCharactersPage = () => {
    setViewSelectCharacter(true);
    setSelectCharacterProp(<SelectCharacter setCharacterNFT={setCharacterNFT}/>);
  }

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    if (!currentAccount) {
      return (
          <button
              className="cta-button connect-wallet-button"
              onClick={connectWalletAction}
          >
            Connect Wallet To Get Started
          </button>
      );
    } else if (currentAccount && !characterNFT) {
        return  (
            <button
              className="cta-button connect-wallet-button"
              onClick={showMintCharactersPage}
            >
            Click to mint an NFT
            </button>
        );
    } else if (currentAccount && characterNFT) {
      return   <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} currentAccount={currentAccount}/>
    }
  };

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const hideSelectCharacter = () => {
    setViewSelectCharacter(false);
  }

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    setButtonReturn(
        <button
          className="cta-button return-button"
          onClick={hideSelectCharacter}
        >
          Return
        </button>
      )    
  }, []);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        if (window.ethereum.networkVersion !== '4') {
          alert("Please connect to Rinkeby!")
        }
      } catch(error) {
        console.log(error)
      }
    }
    if(currentAccount){
      checkNetwork();
    }
  }, [currentAccount]);

  useEffect(() => {
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      const txn = await gameContract.checkIfUserHasNFT();
      if (txn.name) {
        console.log('User has character NFT');
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log('No character NFT found');
      }
      setIsLoading(false);
    };

    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Dragonball Metaverse ⚔️</p>
          <p className="sub-text">Team up to protect against Broly!</p>
        </div>
        <div className="connect-wallet-container">
          <img
            src="https://i.pinimg.com/originals/9d/0e/08/9d0e0846c6e64d02c63496a29984525b.gif"
            alt="Broly, The Boss"
          />
        {renderContent()}
        </div>
        <div className='characters-container'>
          { (viewSelectCharacter) ? selectCharacterProp : ''}
        </div>
        <div className='button-return-container'>
          { (viewSelectCharacter) ? buttonReturn : ''}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;