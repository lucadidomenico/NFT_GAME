const deployContract = async () => {

  const names = ["Goku", "Vegeta", "Gohan", "Junior"]

  const urls = [
    "QmRiy1XunkjtgRtvvfZ1hDCLj5dLSiFqHpsuWLuiGSxY6W", // goku
    "QmdSRs5ppr56JqJTmNray5ssdTyx9423D63TSyrVgkpMi1", // vegeta
    "QmXKCknDmh4tjy7KHGjYXCyFyKUJW8ytWxeP7aacqyE7w6", // gohan
    "QmRoXFE636ESCXrRTwfqD7ab5qyma113Gz25QnYRdnc6Xr" // piccolo
  ]

  const gameContractFactory = await hre.ethers.getContractFactory('MyEpicGame');
  const gameContract = await gameContractFactory.deploy(
      names,
      urls,
      [100, 200, 300, 100],                    
      [100, 50, 25, 100],                       
      "Broly - The boss", 
      "QmfDfGqy66q5qKiBrJCZ2zns6JW4js5aQYpMCGRqWMgbtW",
      10000, 
      50 
  );
  await gameContract.deployed();
  console.log("Contract deployed to:", gameContract.address);
  console.log("Done!");
};

const deployOracle = async() => {
  console.log("Initializing Subscription Manager Contract...");
  const subscriptionManagerContractFactory = await hre.ethers.getContractFactory('VRFv2SubscriptionManager');
  const subscriptionManagerContract = await subscriptionManagerContractFactory.deploy();
  await subscriptionManagerContract.deployed();
  console.log("Contract deployed to:", subscriptionManagerContract.address);

  const VRFv2ConsumerFactory = await hre.ethers.getContractFactory('contracts/VRFv2Consumer.sol:VRFv2Consumer');
  const VRFv2ConsumerContract = await VRFv2ConsumerFactory.deploy(await subscriptionManagerContract.s_subscriptionId());
  await VRFv2ConsumerContract.deployed();

  await subscriptionManagerContract.addConsumer(VRFv2ConsumerContract.address);
  await subscriptionManagerContract.topUpSubscription("1000000000000000000"); // 3 LINK
  await VRFv2ConsumerContract.requestRandomWords();

  // await subscriptionManagerContract.topUpSubscription("3000000000000000000"); // 3 LINK
  // await subscriptionManagerContract.requestRandomWords();
  // console.log("view the pending request here: https://vrf.chain.link/rinkeby/" + await subscriptionManagerContract.s_subscriptionId())
  // console.log("The random word is: " + subscriptionManagerContract.s_randomWords);
  // await subscriptionManagerContract.removeConsumer(subscriptionManagerContract.address);
  // await subscriptionManagerContract.cancelSubscription(subscriptionManagerContract.address);
}
  
const runMain = async () => {
  try {
    await deployContract();
    // await deployOracle();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
  
runMain();