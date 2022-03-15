const CONTRACT_ADDRESS = '0x6Dc5a8eEc09D5E45853742312c1B9f1d03D41B91';

const transformCharacterData = (characterData) => {
  return {
    holder: characterData.holder,
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };