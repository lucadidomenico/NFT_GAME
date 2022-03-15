const main = async () => {

    const names = ["Sol Ring","Swamp","Mountain","Ancient Craving","Vampiric Dragon"]

    const urls = [
      "https://static.starcitygames.com/sales/cardscans/POPUPS/sol_ring.jpg",
      "https://static.starcitygames.com/sales/cardscans/POPUPS/_swamp.jpg",
      "https://static.starcitygames.com/sales/cardscans/POPUPS/_mountain.jpg",
      "https://static.starcitygames.com/sales/cardscans/POPUPS/ancient_craving.jpg",
      "https://static.starcitygames.com/sales/cardscans/POPUPS/vampiric_dragon.jpg"
    ]

    const gameContractFactory = await hre.ethers.getContractFactory('MyEpicGame');
    const gameContract = await gameContractFactory.deploy(
        names,
        urls,
        [100, 200, 300, 100, 200],                    
        [100, 50, 25, 100, 50],                       
        "The boss", 
        "https://i.imgur.com/AksR0tt.png", 
        10000, 
        50 
    );
    await gameContract.deployed();
    console.log("Contract deployed to:", gameContract.address);
  
    let txn;
    txn = await gameContract.mintCharacterNFT(2);
    await txn.wait();
  
    txn = await gameContract.attackBoss();
    await txn.wait();
  
    txn = await gameContract.attackBoss();
    await txn.wait();
  
    console.log("Done!");
  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();