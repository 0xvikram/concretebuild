import { ethers } from "hardhat";

async function main() {
  console.log("⚠️  DEPLOYING TO ETHEREUM MAINNET ⚠️");
  console.log("This will cost real ETH. Make sure you have reviewed everything.\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Mainnet addresses
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const CBLD_ADDRESS = "0xB3C1cd5DC12410c0efD49c8DDf0503864Eb92983";

  console.log("\nUsing existing token addresses:");
  console.log("USDC:", USDC_ADDRESS);
  console.log("CBLD:", CBLD_ADDRESS);

  // Deploy CBDRewardDistributor
  console.log("\n1. Deploying CBDRewardDistributor...");
  const CBDRewardDistributor = await ethers.getContractFactory("CBDRewardDistributor");
  const distributor = await CBDRewardDistributor.deploy(
    CBLD_ADDRESS,
    deployer.address, // admin (should be multisig in production)
    ethers.parseEther("500"), // 500 CBLD listing reward
    0, // Not used with 9% calculation
    ethers.parseEther("100") // 100 CBLD rent reward
  );
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("✅ CBDRewardDistributor deployed to:", distributorAddress);

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("USDC (existing):        ", USDC_ADDRESS);
  console.log("CBLD (existing):        ", CBLD_ADDRESS);
  console.log("CBDRewardDistributor:   ", distributorAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n⚠️  CRITICAL POST-DEPLOYMENT STEPS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network mainnet ${distributorAddress} ${CBLD_ADDRESS} ${deployer.address} ${ethers.parseEther("500")} 0 ${ethers.parseEther("100")}`);
  
  console.log("\n2. Exclude distributor from CBLD fees:");
  console.log("   Call CBLD.excludeFromFee() with distributor address");
  console.log(`   Address: ${distributorAddress}`);
  
  console.log("\n3. Fund distributor with CBLD:");
  console.log("   Transfer CBLD tokens to distributor");
  console.log("   Then call distributor.fundDistributor(amount)");
  
  console.log("\n4. Transfer admin role to multisig:");
  console.log("   Use Gnosis Safe for production admin operations");
  console.log("   Call distributor.grantRole(ADMIN_ROLE, multisigAddress)");
  console.log("   Then renounceRole(ADMIN_ROLE, deployerAddress)");
  
  console.log("\n5. Update environment variables:");
  console.log(`   CBD_REWARD_DISTRIBUTOR_ADDRESS=${distributorAddress}`);
  
  console.log("\n6. Deploy PropertyEscrow contracts per property:");
  console.log("   Use the per-property deployment script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
