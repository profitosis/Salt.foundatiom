import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, SALT_BRICK_NFT_ABI, NETWORK_CONFIG } from '../config';

// Mock function to get salt values - replace with actual implementation
const getSaltValues = async (account) => {
  // This is a placeholder - replace with actual contract calls to get salt values
  return {
    SALT1: '1000',
    SALT2: '500',
    SALT3: '250',
    SALT4: '100',
    totalValue: '1850',
    account: account,
    // Add mock data for the UI
    nextAirdrop: '3d 12h',
    rebateRate: '30%',
    attentionScore: '87',
    lastActive: '2h ago'
  };
};

const PromptScroll = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [promptPrice, setPromptPrice] = useState('0.01');
  const [nftId, setNftId] = useState(0);
  const [status, setStatus] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [saltValues, setSaltValues] = useState({
    SALT1: '0',
    SALT2: '0',
    SALT3: '0',
    SALT4: '0',
    totalValue: '0',
    nextAirdrop: '--',
    rebateRate: '0%',
    attentionScore: '0',
    lastActive: '--',
    isLoading: true
  });

  // Initialize provider and check network
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        // Create provider and signer
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        // Get network
        const network = await web3Provider.getNetwork();
        setNetworkId(network.chainId);
        
        // Check if connected to correct network
        const targetChainId = parseInt(NETWORK_CONFIG.chainId, 16);
        setIsCorrectNetwork(network.chainId === targetChainId);
        
        // Set up contract
        const signer = web3Provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, SALT_BRICK_NFT_ABI, signer);
        setContract(contract);

        // Check if wallet is connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          await Promise.all([
            loadPrompts(accounts[0]),
            loadSaltValues(accounts[0])
          ]);
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    };

    initProvider();

    // Clean up event listeners
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          await Promise.all([
            loadPrompts(accounts[0]),
            loadSaltValues(accounts[0])
          ]);
        } else {
          setCurrentAccount('');
          setPrompts([]);
          setSaltValues({
            SALT1: '0',
            SALT2: '0',
            SALT3: '0',
            SALT4: '0',
            totalValue: '0',
            isLoading: false
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Clean up
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [loadPrompts, loadSaltValues]);

  // Load salt values for the connected wallet
  const loadSaltValues = useCallback(async (account) => {
    if (!account) return;
    
    try {
      setSaltValues(prev => ({ ...prev, isLoading: true }));
      const values = await getSaltValues(account);
      setSaltValues({
        ...values,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading salt values:', error);
      setSaltValues(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []);

  // Load prompts for the connected wallet
  const loadPrompts = useCallback(async (account, tokenId) => {
    if (!contract || !account) return;
    
    try {
      setStatus('Loading prompts...');
      
      // Get the number of prompts for the NFT
      const count = await contract.getPromptCount(tokenId);
      const promptsList = [];
      
      // Get each prompt
      for (let i = 0; i < count; i++) {
        const [content, price, timestamp] = await contract.getPromptAt(tokenId, i);
        promptsList.push({
          content,
          price: ethers.utils.formatEther(price),
          timestamp: new Date(timestamp * 1000).toLocaleString()
        });
      }
      
      setPrompts(promptsList);
      const statusMessage = promptsList.length > 0 ? '' : 'No prompts found for this NFT';
      setStatus(statusMessage);
      
      // If we have prompts, get the total scroll value
      if (promptsList.length > 0) {
        try {
          const totalValue = await contract.getScrollValue(tokenId);
          setStatus(`Total Scroll Value: ${ethers.utils.formatEther(totalValue)} ETH`);
        } catch (error) {
          console.error('Error getting scroll value:', error);
        }
      }
      
    } catch (error) {
      console.error('Error loading prompts:', error);
      setStatus(`Error: ${error.message || 'Failed to load prompts'}`);
    }
  };

  // Connect wallet and check network
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this dApp!');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get current network
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      const targetChainId = parseInt(NETWORK_CONFIG.chainId, 16);
      
      // Check if connected to the correct network
      if (network.chainId !== targetChainId) {
        try {
          // Prompt user to switch to the correct network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_CONFIG.chainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [NETWORK_CONFIG],
              });
            } catch (addError) {
              console.error('Error adding network:', addError);
              throw new Error('Failed to add network to MetaMask');
            }
          } else {
            console.error('Error switching network:', switchError);
            throw new Error('Failed to switch network');
          }
        }
      }
      
      // Update account and load prompts
      setCurrentAccount(accounts[0]);
      await loadPrompts(accounts[0], 0);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  // Mint a new NFT with a prompt
  const mintNFT = async () => {
    if (!currentAccount) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (!newPrompt.trim()) {
      setStatus('Please enter a prompt');
      return;
    }

    try {
      setStatus('Minting NFT with initial prompt...');
      
      // Convert price to wei (assuming price is in ETH)
      const priceInWei = ethers.utils.parseEther(promptPrice.toString());
      
      // Mint the NFT with the first prompt
      const tx = await contract.mint(
        currentAccount, 
        'ipfs://your-metadata-uri',
        newPrompt,
        priceInWei,
        { value: priceInWei } // Include payment in the transaction
      );
      
      await tx.wait();
      
      // Get the token ID from the transaction receipt
      const receipt = await provider.getTransactionReceipt(tx.hash);
      const event = receipt.logs.find(
        log => log.topics[0] === ethers.utils.id('Transfer(address,address,uint256)')
      );
      
      if (event) {
        const tokenId = ethers.BigNumber.from(event.topics[3]).toNumber();
        setNftId(tokenId);
        setStatus(`NFT #${tokenId} minted with initial prompt!`);
        
        // Load prompts for the new NFT
        await loadPrompts(currentAccount, tokenId);
      } else {
        setStatus('NFT minted, but could not retrieve token ID');
      }
      
      // Reset form
      setNewPrompt('');
      setPromptPrice('0.01');
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      setStatus(`Error: ${error.message || 'Failed to mint NFT'}`);
    }
  };

  // Add a prompt to an existing NFT
  const addPrompt = async () => {
    if (!currentAccount) {
      setStatus('Please connect your wallet first');
      return;
    }
    
    if (!newPrompt.trim()) {
      setStatus('Please enter a prompt');
      return;
    }
    
    if (nftId === null || nftId === undefined) {
      setStatus('No NFT selected');
      return;
    }
    
    try {
      setStatus('Adding prompt to NFT...');
      
      // Convert price to wei (assuming price is in ETH)
      const priceInWei = ethers.utils.parseEther(promptPrice.toString());
      
      // Add prompt to the NFT
      const tx = await contract.addPromptToScroll(
        nftId, 
        newPrompt, 
        priceInWei,
        'ipfs://updated-uri',
        { value: priceInWei } // Include payment in the transaction
      );
      
      await tx.wait();
      
      // Update UI
      setStatus('Prompt added successfully!');
      setNewPrompt('');
      setPromptPrice('0.01');
      
      // Reload prompts
      await loadPrompts(currentAccount, nftId);
      
    } catch (error) {
      console.error('Error adding prompt:', error);
      setStatus(`Error: ${error.message || 'Failed to add prompt'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Prompt Scroll NFT</h1>
        <p className="text-gray-600 mb-6">Create and manage your NFT prompt scrolls</p>
        
        {!currentAccount ? (
          <div className="text-center py-8">
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Connect Wallet to Get Started
            </button>
            <p className="mt-4 text-sm text-gray-500">
              You'll need MetaMask or a Web3 wallet to continue
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Account Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Connected Wallet</h3>
                  <p className="font-mono text-sm text-gray-900">
                    {`${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isCorrectNetwork ? 'Connected to correct network' : 'Wrong network'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mint New NFT Section */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">✨ Create New Prompt Scroll</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Prompt
                  </label>
                  <textarea
                    id="newPrompt"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Enter your creative prompt here..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETH)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">Ξ</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        value={promptPrice}
                        onChange={(e) => setPromptPrice(e.target.value)}
                        step="0.01"
                        min="0.01"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={mintNFT}
                      disabled={!newPrompt.trim() || !isCorrectNetwork}
                      className={`w-full px-6 py-3 rounded-lg font-medium text-white ${!newPrompt.trim() || !isCorrectNetwork 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'}`}
                    >
                      Mint New Scroll
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Existing NFT Section */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📜 Add to Existing Scroll</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="nftId" className="block text-sm font-medium text-gray-700 mb-1">
                    NFT ID
                  </label>
                  <input
                    type="number"
                    id="nftId"
                    value={nftId || ''}
                    onChange={(e) => setNftId(parseInt(e.target.value) || 0)}
                    placeholder="Enter NFT ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="addPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Prompt
                  </label>
                  <textarea
                    id="addPrompt"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Add to the scroll's story..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="addPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETH)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">Ξ</span>
                      </div>
                      <input
                        type="number"
                        id="addPrice"
                        value={promptPrice}
                        onChange={(e) => setPromptPrice(e.target.value)}
                        step="0.01"
                        min="0.01"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addPrompt}
                      disabled={!newPrompt.trim() || !nftId || !isCorrectNetwork}
                      className={`w-full px-6 py-3 rounded-lg font-medium text-white ${!newPrompt.trim() || !nftId || !isCorrectNetwork
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90'}`}
                    >
                      Add to Scroll
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Salt Epoch Values - Neomorphic Orange Gradient */}
            <div className="p-6 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                  🧂 Salt Epoch Economy
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => loadSaltValues(currentAccount)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 transition-all duration-200 shadow-sm hover:shadow-md active:shadow-inner"
                  >
                    Refresh
                  </button>
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm hover:shadow-md active:shadow-inner">
                    Claim Airdrop
                  </button>
                </div>
              </div>
              
              {saltValues.isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex space-x-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-24 w-24 bg-amber-100 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                  {/* Salt Tiers */}
                  {['SALT1', 'SALT2', 'SALT3', 'SALT4'].map((salt, index) => {
                    const value = saltValues[salt];
                    const colors = [
                      'from-amber-400 to-amber-500',
                      'from-orange-400 to-amber-500',
                      'from-orange-500 to-red-500',
                      'from-red-500 to-rose-500'
                    ][index];
                    
                    return (
                      <div key={salt} className={`p-5 rounded-xl bg-white bg-opacity-50 backdrop-blur-sm border border-white border-opacity-30 shadow-[inset_2px_2px_4px_#ffffff80,inset_-2px_-2px_4px_#0000001a]`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Tier {index + 1}</div>
                            <div className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${colors} mt-1`}>
                              {value}
                            </div>
                            <div className="text-xs text-amber-600 mt-1">${salt.replace('SALT', '')} per kg</div>
                          </div>
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-white to-amber-50 shadow-inner">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center text-white text-lg`}>
                              {index + 1}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-100">
                          <div className="flex justify-between text-xs text-amber-700">
                            <span>Next Airdrop</span>
                            <span className="font-medium">{saltValues.nextAirdrop}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Total Value */}
                  <div className={`p-5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg`}>
                    <div className="text-sm font-medium opacity-80">Total Value</div>
                    <div className="text-3xl font-bold mt-1">{saltValues.totalValue} <span className="text-amber-100">kg</span></div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs opacity-80">
                        <span>Current Rebate</span>
                        <span className="font-medium">{saltValues.rebateRate}</span>
                      </div>
                      <div className="w-full bg-amber-200 bg-opacity-30 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full" 
                          style={{ width: `${parseInt(saltValues.rebateRate) || 0}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs opacity-80 mt-4">
                        <span>Attention Score</span>
                        <span className="font-medium">{saltValues.attentionScore}/100</span>
                      </div>
                      <div className="w-full bg-amber-200 bg-opacity-30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-300 to-yellow-300 h-2 rounded-full" 
                          style={{ width: `${saltValues.attentionScore}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <button className="w-full mt-6 py-2 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm">
                      View Analytics
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-5 border-t border-amber-100 flex justify-between items-center text-sm text-amber-800">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                  <span>Last active: {saltValues.lastActive}</span>
                </div>
                <div className="flex space-x-3">
                  <button className="hover:text-amber-600 transition-colors">
                    <span className="sr-only">Info</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="hover:text-amber-600 transition-colors">
                    <span className="sr-only">Settings</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Prompts List */}
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">📜 Your Scrolls</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => loadPrompts(currentAccount, nftId)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  >
                    Refresh Scrolls
                  </button>
                  <button 
                    onClick={() => currentAccount && loadSaltValues(currentAccount)}
                    className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded-md text-blue-600"
                  >
                    Refresh Salts
                  </button>
                </div>
              </div>
              
              {prompts.length > 0 ? (
                <div className="space-y-4">
                  {prompts.map((prompt, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <p className="text-gray-800 whitespace-pre-line">{prompt.content}</p>
                      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                        <span>Prompt #{index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700">
                            {parseFloat(prompt.price).toFixed(4)} ETH
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {prompt.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No prompts found for this scroll.</p>
                  <p className="text-sm text-gray-400 mt-1">Mint a new scroll or add prompts to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Status Message */}
      {status && (
        <div className={`p-4 rounded-lg mb-6 ${status.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          <div className="flex items-center">
            {status.includes('Error') ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{status}</span>
          </div>
        </div>
      )}
      
      {/* Network Info */}
      {!isCorrectNetwork && currentAccount && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You're connected to the wrong network. Please switch to <span className="font-medium">{NETWORK_CONFIG.chainName}</span> in your wallet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptScroll;
