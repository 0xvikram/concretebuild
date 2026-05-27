import { ethers } from "hardhat";

// Configuration for the property
const PROPERTY_CONFIG = {
  propertyId: 1, // Update this for each property
  propertyOwner: "0x...", // Property owner wallet address
  platformAdmin: "0x...", // Platform admin (multisig recommended)
  platformTreasury: "0x...", // Platform treasury address
  totalValuation: ethers.parseUnits("100000", 6), // $100,000 USDC
  totalShares: 10000, // 10,000 shares
  network: "mainnet" // or "sepolia"
};

async function main() {
  console.log(`\n🏠 Deploying PropertyEscrow for Property #${PROPERTY_CONFIG.propertyId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Network-specific addresses
  const USDC_ADDRESS = PROPERTY_CONFIG.network === "mainnet" 
    ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    : process.env.SEPOLIA_USDC_ADDRESS || "";

  console.log("Configuration:");
  console.log("  Property ID:", PROPERTY_CONFIG.propertyId);
  console.log("  Property Owner:", PROPERTY_CONFIG.propertyOwner);
  console.log("  Platform Admin:", PROPERTY_CONFIG.platformAdmin);
  console.log("  Total Valuation:", ethers.formatUnits(PROPERTY_CONFIG.totalValuation, 6), "USDC");
  console.log("  Total Shares:", PROPERTY_CONFIG.totalShares);
  console.log("  USDC Address:", USDC_ADDRESS);
  console.log();

  // Validation
  if (PROPERTY_CONFIG.propertyOwner === "0x...") {
    throw new Error("Please update PROPERTY_CONFIG.propertyOwner");
  }
  if (PROPERTY_CONFIG.platformAdmin === "0x...") {
    throw new Error("Please update PROPERTY_CONFIG.platformAdmin");
  }
  if (PROPERTY_CONFIG.platformTreasury === "0x...") {
    throw new Error("Please update PROPERTY_CONFIG.platformTreasury");
  }

  // Deploy PropertyEscrow
  console.log("Deploying PropertyEscrow...");
  const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
  const propertyEscrow = await PropertyEscrow.deploy(
    PROPERTY_CONFIG.propertyId,
    PROPERTY_CONFIG.propertyOwner,
    PROPERTY_CONFIG.platformAdmin,
    PROPERTY_CONFIG.platformTreasury,
    USDC_ADDRESS,
    PROPERTY_CONFIG.totalValuation,
    PROPERTY_CONFIG.totalShares
  );
  await propertyEscrow.waitForDeployment();
  const escrowAddress = await propertyEscrow.getAddress();
  
  console.log("✅ PropertyEscrow deployed to:", escrowAddress);

  console.log("\n📝 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Property ID:        ", PROPERTY_CONFIG.propertyId);
  console.log("Contract Address:   ", escrowAddress);
  console.log("Property Owner:     ", PROPERTY_CONFIG.propertyOwner);
  console.log("Platform Admin:     ", PROPERTY_CONFIG.platformAdmin);
  console.log("Total Valuation:    ", ethers.formatUnits(PROPERTY_CONFIG.totalValuation, 6), "USDC");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next Steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${PROPERTY_CONFIG.network} ${escrowAddress} \\`);
  console.log(`     ${PROPERTY_CONFIG.propertyId} \\`);
  console.log(`     ${PROPERTY_CONFIG.propertyOwner} \\`);
  console.log(`     ${PROPERTY_CONFIG.platformAdmin} \\`);
  console.log(`     ${PROPERTY_CONFIG.platformTreasury} \\`);
  console.log(`     ${USDC_ADDRESS} \\`);
  console.log(`     ${PROPERTY_CONFIG.totalValuation} \\`);
  console.log(`     ${PROPERTY_CONFIG.totalShares}`);
  
  console.log("\n2. Update database with contract address:");
  console.log(`   UPDATE properties SET contract_address = '${escrowAddress}' WHERE id = ${PROPERTY_CONFIG.propertyId};`);
  
  console.log("\n3. Activate property (admin only):");
  console.log("   Call propertyEscrow.activateProperty() from admin wallet");
  
  console.log("\n4. Set up event listener:");
  console.log("   Add contract to Alchemy webhook configuration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
