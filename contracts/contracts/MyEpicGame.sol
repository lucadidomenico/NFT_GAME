// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "./libraries/Base64.sol";
import "hardhat/console.sol";

contract MyEpicGame is ERC721("Heroes", "HERO"), VRFConsumerBaseV2 {

  struct CharacterAttributes {
    address holder;
    uint characterIndex;
    string name;
    string imageURI;        
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  struct BigBoss {
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  CharacterAttributes[] defaultCharacters;
  CharacterAttributes[] allPlayersCharacters;
  mapping(uint256 => CharacterAttributes) public nftHolderAttributes;
  mapping(address => uint256) public nftHolders;
  address[] private holders;
  event CharacterNFTMinted(address sender, uint256 tokenId, uint256 characterIndex);
  event AttackComplete(uint newBossHp, uint newPlayerHp);
  event RandomNumberReceived(uint256 s_randomRange);
  BigBoss public bigBoss;

  //Chainlink fields
  VRFCoordinatorV2Interface COORDINATOR;
  LinkTokenInterface LINKTOKEN;
  uint64 s_subscriptionId = 604;
  address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
  address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
  bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
  uint32 callbackGasLimit = 300000;
  uint16 requestConfirmations = 3;
  uint32 numWords =  1;
  // uint256 public s_randomRange;
  // uint256 public s_requestId;
  mapping(uint256 => uint256) public requestId_randomRange;
  mapping(address => uint256) public holder_requestId;
  // address s_owner;

  constructor(
    string[] memory characterNames,
    string[] memory characterImageURIs,
    uint[] memory characterHp,
    uint[] memory characterAttackDmg,
    string memory bossName,
    string memory bossImageURI,
    uint bossHp,
    uint bossAttackDamage
  ) 
  VRFConsumerBaseV2(vrfCoordinator)
  {
    // Chainlink consumer initialization
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
    LINKTOKEN = LinkTokenInterface(link);
    // s_owner = msg.sender;

    //MyEpicGame initialization
    bigBoss = BigBoss({
      name: bossName,
      imageURI: bossImageURI,
      hp: bossHp,
      maxHp: bossHp,
      attackDamage: bossAttackDamage
    });

    console.log("Done initializing boss %s w/ HP %s, img %s", bigBoss.name, bigBoss.hp, bigBoss.imageURI);
    for(uint i = 0; i < characterNames.length; i += 1) {
      defaultCharacters.push(CharacterAttributes({
        holder: address(0),
        characterIndex: i,
        name: characterNames[i],
        imageURI: characterImageURIs[i],
        hp: characterHp[i],
        maxHp: characterHp[i],
        attackDamage: characterAttackDmg[i]
      }));

      CharacterAttributes memory c = defaultCharacters[i];
      
      console.log("Done initializing %s w/ HP %s, img %s", c.name, c.hp, c.imageURI);
    }

    _tokenIds.increment(); //first token start from 1
  }

  function mintCharacterNFT(uint _characterIndex) external {
    uint256 newItemId = _tokenIds.current();

    _safeMint(msg.sender, newItemId);

    CharacterAttributes memory newNFT = CharacterAttributes({
      holder: msg.sender,
      characterIndex: _characterIndex,
      name: defaultCharacters[_characterIndex].name,
      imageURI: defaultCharacters[_characterIndex].imageURI,
      hp: defaultCharacters[_characterIndex].hp,
      maxHp: defaultCharacters[_characterIndex].maxHp,
      attackDamage: defaultCharacters[_characterIndex].attackDamage
    });

    nftHolderAttributes[newItemId] = newNFT;

    allPlayersCharacters.push(newNFT);

    console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);
    
    nftHolders[msg.sender] = newItemId;

    _tokenIds.increment();
    emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];

    string memory strHp = Strings.toString(charAttributes.hp);
    string memory strMaxHp = Strings.toString(charAttributes.maxHp);
    string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);

    string memory json = Base64.encode(
      abi.encodePacked(
        '{"name": "',
        charAttributes.name,
        ' -- NFT #: ',
        Strings.toString(_tokenId),
        '", "description": "This is an NFT that lets people play in the game Metaverse Slayer!", "image": "ipfs://',
        charAttributes.imageURI,
        '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
        strAttackDamage,'} ]}'
      )
    );

    string memory output = string(
      abi.encodePacked("data:application/json;base64,", json)
    );
    
    return output;
  }

  function attackBoss() public onlyHolder {
    uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
    CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];

    console.log("\nPlayer w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.attackDamage);
    console.log("Boss %s has %s HP and %s AD", bigBoss.name, bigBoss.hp, bigBoss.attackDamage);
    
    require (
      player.hp > 0,
      "Error: character must have HP to attack boss."
    );

    require (
      bigBoss.hp > 0,
      "Error: boss must have HP to attack character."
    );

    uint256 attackDamage = player.attackDamage;

    if(requestId_randomRange[holder_requestId[msg.sender]] == 50) {
      attackDamage = 5000;
    }
    
    if (bigBoss.hp < attackDamage) {
      bigBoss.hp = 0;
    } else {
      bigBoss.hp = bigBoss.hp - attackDamage;
    }

    if (player.hp < bigBoss.attackDamage) {
      player.hp = 0;
    } else {
      player.hp = player.hp - bigBoss.attackDamage;
    }
    
    console.log("Player attacked boss. New boss hp: %s", bigBoss.hp);
    console.log("Boss attacked player. New player hp: %s\n", player.hp);

    emit AttackComplete(bigBoss.hp, player.hp);
  }

  function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
    uint256 userNftTokenId = nftHolders[msg.sender];
    if (userNftTokenId > 0) {
      return nftHolderAttributes[userNftTokenId];
    }
    else {
      CharacterAttributes memory emptyStruct;
      return emptyStruct;
    }
  }

  function getAllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
    return defaultCharacters;
  }

  function getBigBoss() public view returns (BigBoss memory) {
    return bigBoss;
  }

  function getAllPlayers() public view returns (CharacterAttributes[] memory) {
    return allPlayersCharacters;
  }

  //Chainlink functions
  function requestRandomWords() public onlyHolder {
    holder_requestId[msg.sender] = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }
  
  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords //assuming only 1 random word was requested i.e. numWords == 1
  ) internal override {
    requestId_randomRange[requestId] = (randomWords[0] % 50) + 1;
    emit RandomNumberReceived(requestId_randomRange[requestId]);
  }

  // modifier onlyOwner() {
  //   require(msg.sender == s_owner);
  //   _;
  // }

  modifier onlyHolder() {
    require(nftHolders[msg.sender] != 0);
    _;
  }
}