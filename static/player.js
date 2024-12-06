const getStrengthBonus = ({ strength, hasActivePrisoner }, bag) => {
    return strength
        + (!!bag[TCardRole.artifact][TSuit.spades] ? config.braceletOfAmokStrengthBonus : 0)
        + (hasActivePrisoner ? config.prisonerStrengthBonus : 0);
};

const getGemCount = (bag) => {
    return !!bag[TCardRole.artifact][TSuit.diamonds]
        ? Infinity
        : bag.gems;
};

const addGems = ({ gems }, value) => {
    return gems + value;
};

const addMagic = ({ magic }, value) => {
    return magic + value;
};

const addStrength = ({ strength }, value) => {
    return strength + value;
};

const addHealth = ({ currentHealth, maxHealth }, value) => {
    return Math.min(maxHealth, currentHealth + value);
};
