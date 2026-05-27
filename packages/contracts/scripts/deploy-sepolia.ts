import { ethers } from "hardhat";

async function main() {
  console.log("Deploying to Sepolia testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy Mock USDC for testnet
  console.log("\n1. Deploying Mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Deploy Mock CBLD for testnet
  console.log("\n2. Deploying Mock CBLD...");
  const mockCbld = await MockERC20.deploy("Concrete Build", "CBLD", 18);
  await mockCbld.waitForDeployment();
  const cbldAddress = await mockCbld.getAddress();
  console.log("Mock CBLD deployed to:", cbldAddress);

  // Mint some CBLD to deployer for testing
  console.log("\n3. Minting CBLD to deployer...");
  await mockCbld.mint(deployer.address, ethers.parseEther("1000000"));
  console.log("Minted 1,000,000 CBLD to deployer");

  // Deploy CBDRewardDistributor
  console.log("\n4. Deploying CBDRewardDistributor...");
  const CBDRewardDistributor = await ethers.getContractFactory("CBDRewardDistributor");
  const distributor = await CBDRewardDistributor.deploy(
    cbldAddress,
    deployer.address, // admin
    ethers.parseEther("500"), // 500 CBLD listing reward
    0, // Not used with 9% calculation
    ethers.parseEther("100") // 100 CBLD rent reward
  );
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("CBDRewardDistributor deployed to:", distributorAddress);

  // Fund distributor with CBLD
  console.log("\n5. Funding distributor with CBLD...");
  const fundAmount = ethers.parseEther("500000");
  const approveTx = await mockCbld.approve(distributorAddress, fundAmount);
  await approveTx.wait();
  console.log("Approved CBLD transfer");
  
  const fundTx = await distributor.fundDistributor(fundAmount);
  await fundTx.wait();
  console.log("Funded distributor with 500,000 CBLD");

  // Deploy example PropertyEscrow
  console.log("\n6. Deploying example PropertyEscrow...");
  const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
  const propertyEscrow = await PropertyEscrow.deploy(
    1, // propertyId
    deployer.address, // propertyOwner
    deployer.address, // platformAdmin
    deployer.address, // platformTreasury
    usdcAddress,
    ethers.parseUnits("100000", 6), // $100,000 valuation
    10000 // 10,000 shares
  );
  await propertyEscrow.waitForDeployment();
  const escrowAddress = await propertyEscrow.getAddress();
  console.log("PropertyEscrow deployed to:", escrowAddress);

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Mock USDC:              ", usdcAddress);
  console.log("Mock CBLD:              ", cbldAddress);
  console.log("CBDRewardDistributor:   ", distributorAddress);
  console.log("PropertyEscrow (Example):", escrowAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next Steps:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${usdcAddress} "USD Coin" "USDC" 6`);
  console.log(`   npx hardhat verify --network sepolia ${cbldAddress} "Concrete Build" "CBLD" 18`);
  console.log(`   npx hardhat verify --network sepolia ${distributorAddress} ${cbldAddress} ${deployer.address} ${ethers.parseEther("500")} 0 ${ethers.parseEther("100")}`);
  console.log("\n2. Update .env with deployed addresses");
  console.log("\n3. Test the contracts on Sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
