const hre = require("hardhat");

async function main() {
  // Deploy the NFT contract
  const SaltBrickNFT = await hre.ethers.getContractFactory("SaltBrickNFT");
  const nft = await SaltBrickNFT.deploy("SaltBrick", "SALTBRICK");
  
  await nft.deployed();
  console.log("SaltBrickNFT deployed to:", nft.address);
  
  // Mint a test NFT
  console.log("Minting test NFT...");
  const [owner] = await hre.ethers.getSigners();
  const tx = await nft.mint(owner.address, "ipfs://test-uri");
  await tx.wait();
  console.log("Minted test NFT to:", owner.address);
  
  // Add a prompt to the NFT
  console.log("Adding test prompt...");
  const promptTx = await nft.addPromptToScroll(
    0, // First token ID
    "Fuck Yosef ghost fucker crappie...", // Prompt content
    hre.ethers.utils.parseEther("33"), // $33 in wei
    "ipfs://updated-uri" // New URI
  );
  await promptTx.wait();
  console.log("Added test prompt to NFT #0");
  
  // Verify prompt was added
  const promptCount = await nft.getPromptCount(0);
  console.log("Total prompts on NFT #0:", promptCount.toString());
  
  const [content, price, timestamp] = await nft.getPromptAt(0, 0);
  console.log("First prompt:", {
    content,
    price: hre.ethers.utils.formatEther(price),
    timestamp: new Date(timestamp * 1000).toISOString()
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
