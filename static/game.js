const getBaseTreasureValue = (card) => {
    if (card.rank === TRank.ace) return 12;
    if (card.rank === TRank.king) return 10;
    if (card.rank === TRank.queen) return 9;
    if (card.rank === TRank.jack) return 8;
    if (card.rank === TRank.joker) return 2;

    return Number(card.rank);
};

const calculateInventoryValue = ({ bag }) => {
    let total = getGemCount(bag);
    for (let type of [TCardRole.lifePotion, TCardRole.magicPotion, TCardRole.strengthPotion]) {
        bag[type].forEach(card => {
            total += card.rank;
        });
    }

    return total;
};

const payFromInventory = (state, amount) => {
    if (!isFinite(getGemCount(state.bag))) {
        return;
    }

    // Use gems first
    if (state.bag.gems >= amount) {
        state.bag.gems -= amount;
        return;
    }
    amount -= state.bag.gems;
    state.bag.gems = 0;

    for (let type of [TCardRole.lifePotion, TCardRole.magicPotion, TCardRole.strengthPotion]) {
        while (state.bag[type].length > 0 && amount > 0) {
            const card = state.bag[type].shift();
            amount -= card.rank;
            state.hand.push({ ...card, state: TCardState.back });
        }
        if (amount <= 0) break;
    }
};

const getTreasureValue = (card) => {
    // Priority order from rules:
    // 1. Ace of diamonds
    // 2. Ace of hearts
    // 3. Ace of clubs
    // 4. Ace of spades
    // 5. 10 of diamonds ... down to 2 of spades

    if (card.rank === TRank.ace) {
        if (card.suit === TSuit.diamonds) return 1000;
        if (card.suit === TSuit.hearts) return 999;
        if (card.suit === TSuit.clubs) return 998;
        if (card.suit === TSuit.spades) return 997;
    }

    const suitBonus = {
        [TSuit.diamonds]: 400,
        [TSuit.hearts]: 300,
        [TSuit.clubs]: 200,
        [TSuit.spades]: 100,
    };

    let rankVal = 0;
    if (isFinite(card.rank)) rankVal = Number(card.rank);
    else if (card.rank === TRank.king) rankVal = 13;
    else if (card.rank === TRank.queen) rankVal = 12;
    else if (card.rank === TRank.jack) rankVal = 11;

    return suitBonus[card.suit] + rankVal;
};

const getLeastValuableTreasure = (state) => {
    let leastValuable = null;
    let minValue = Infinity;

    // Check artifacts
    for (let suit in state.bag[TCardRole.artifact]) {
        const card = state.bag[TCardRole.artifact][suit];
        if (card) {
            const val = getTreasureValue(card);
            if (val < minValue) {
                minValue = val;
                leastValuable = { card, pos: { bagSectionType: TCardRole.artifact, bagSectionItemIndex: suit } };
            }
        }
    }

    // Check potions
    const potionTypes = [TCardRole.lifePotion, TCardRole.magicPotion, TCardRole.strengthPotion];
    for (let type of potionTypes) {
        state.bag[type].forEach((card, index) => {
            const val = getTreasureValue(card);
            if (val < minValue) {
                minValue = val;
                leastValuable = { card, pos: { bagSectionType: type, bagSectionItemIndex: index } };
            }
        });
    }

    return leastValuable;
};

const getMostValuableTreasure = (state) => {
    let mostValuable = null;
    let maxValue = -1;

    // Check artifacts
    for (let suit in state.bag[TCardRole.artifact]) {
        const card = state.bag[TCardRole.artifact][suit];
        if (card) {
            const val = getTreasureValue(card);
            if (val > maxValue) {
                maxValue = val;
                mostValuable = { card, pos: { bagSectionType: TCardRole.artifact, bagSectionItemIndex: suit } };
            }
        }
    }

    // Check potions
    const potionTypes = [TCardRole.lifePotion, TCardRole.magicPotion, TCardRole.strengthPotion];
    for (let type of potionTypes) {
        state.bag[type].forEach((card, index) => {
            const val = getTreasureValue(card);
            if (val > maxValue) {
                maxValue = val;
                mostValuable = { card, pos: { bagSectionType: type, bagSectionItemIndex: index } };
            }
        });
    }

    return mostValuable;
};

const setPlayerActionSelector = (choices, actionSelector) => {
    actionSelector.choices = choices;
    actionSelector.actions = {};
    for (let choice of choices) {
        const uuid = crypto.randomUUID();
        actionSelector.actions[uuid] = {
            uuid,
            ...choice,
            callback: () => {
                actionSelector.choices = [];
                actionSelector.actions = {};
                choice.callback();
            },
        };
    }
};

const retrieveTreasure = (chamber, state) => {
    const treasure = chamber.treasure;
    chamber.treasure = null;

    console.debug(`${chamber.row}:${chamber.column}: ${treasure.rank} of ${treasure.suit}`);

    if (treasure.rank === TRank.ace) {
        if (state.bag[TCardRole.artifact][treasure.suit] !== null) {
            state.log.push(message.treasure.fakeArtifact);
            return;
        }

        switch (treasure.suit) {
            // The Ruby of Gaza
            case TSuit.hearts: {
                state.player.maxHealth += config.rubyOfGazaHealthBonus;
                state.log.push(message.treasure.found(message.treasure.rubyOfGaza(config.rubyOfGazaHealthBonus), treasure));
                break;
            }
            // The Bag of Meres
            case TSuit.diamonds: {
                state.log.push(message.treasure.found(message.treasure.bagOfMeres, treasure));
                break;
            }
            // The Bracelet of Armok
            case TSuit.spades: {
                state.log.push(message.treasure.found(message.treasure.braceletOfAmok, treasure));
                break;
            }
            // The Scepter of Leynos
            case TSuit.clubs: {
                state.log.push(message.treasure.found(message.treasure.scepterOfLeynos, treasure));
                break;
            }
        }

        state.bag[TCardRole.artifact][treasure.suit] = { ...treasure, state: TCardState.face };
        return;
    }

    // life potion
    if (treasure.suit === TSuit.hearts && !isNaN(treasure.rank)) {
        state.bag[TCardRole.lifePotion].push({ ...treasure, state: TCardState.face });
        state.log.push(message.treasure.found(message.treasure.lifePotion(treasure), treasure));
        return;
    }

    // gems
    if (treasure.suit === TSuit.diamonds && !isNaN(treasure.rank)) {
        state.bag.gems = addGems(state.bag, treasure.rank);
        state.log.push(message.treasure.found(message.treasure.gems(treasure), treasure));
        return;
    }

    // strength potion
    if (treasure.suit === TSuit.spades && !isNaN(treasure.rank)) {
        state.bag[TCardRole.strengthPotion].push({ ...treasure, state: TCardState.face });
        state.log.push(message.treasure.found(message.treasure.strengthPotion(treasure), treasure));
        return;
    }

    // magic potion
    if (treasure.suit === TSuit.clubs && !isNaN(treasure.rank)) {
        state.bag[TCardRole.magicPotion].push({ ...treasure, state: TCardState.face });
        state.log.push(message.treasure.found(message.treasure.magicPotion(treasure), treasure));
        return;
    }

    // prisoner - joins player
    if (treasure.rank === TRank.jack) {
        state.bag[TCardRole.prisoner].push({ ...treasure, state: TCardState.face });
        state.log.push(message.treasure.found(message.treasure.prisoner, treasure));
        return;
    }

    // white magic priestess - heals player
    if (treasure.rank === TRank.queen && [TSuit.diamonds, TSuit.hearts].includes(treasure.suit)) {
        state.hand.push({ ...treasure, state: TCardState.back });
        state.player.currentHealth = addHealth(state.player, state.player.maxHealth);
        state.log.push(message.encounter.whiteMagicPriestess.woundsCuredWithTreasure);
        return;
    }

    // black magic priestess - steals least precious treasure from player
    if (treasure.rank === TRank.queen && [TSuit.spades, TSuit.clubs].includes(treasure.suit)) {
        state.hand.push({ ...treasure, state: TCardState.back });
        const leastValuable = getLeastValuableTreasure(state);
        if (leastValuable) {
            useBagItem(state, leastValuable.pos, { actionType: null });
        }
        state.log.push(message.encounter.blackMagicPriestess.challengeWithoutTreasure(leastValuable?.card));
        return;
    }

    // genie of life - increases max HP
    if (treasure.rank === TRank.king && treasure.suit === TSuit.hearts) {
        state.hand.push({ ...treasure, state: TCardState.back });
        state.player.maxHealth += config.genieOfLifeHealthBonus;
        state.log.push(message.encounter.genie.life(config.genieOfLifeHealthBonus));
        return;
    }

    /**
     * [Genie of luck - gives three treasure cards]
     * Draw three cards from your Hand Deck, and add these cards to your inventory, as treasure cards!
     * SPECIAL CASE: If you find a queen (of any color) among the three cards that you draw, you cannot store them in your inventory. You must allow them to play their roles immediately, and then place them back into your Hand Deck.
     * SPECIAL CASE: If you find another king (a.k.a another genie) among the three cards that you draw, YOU CANNOT use this genie. You must place it immediately under your Hand Deck; this card must be regarded as lost.
     * SPECIAL CASE: If you find a joker (a.k.a Hebrac the sorcerer), you must IMMEDIATELY choose to play (or not to play) the sorcerer's game before you can continue your journey. (Refer to the paragraph relative to the joker, further down this section, to find out more about Hebrac's "game".)
     */
    if (treasure.rank === TRank.king && treasure.suit === TSuit.diamonds) {
        state.log.push(message.encounter.genie.treasure);

        for (let i = 0; i < 3; i++) {
            const card = state.hand.shift();
            if (card.rank === TRank.king) {
                state.hand.push({ ...card, state: TCardState.back });
                state.log.push(message.treasure.useless);
                continue;
            }

            retrieveTreasure({ ...chamber, treasure: card }, state);
        }
        return;
    }

    // genie of death - destroys three enemy cards among those that lie in chambers you have not yet visited
    if (treasure.rank === TRank.king && treasure.suit === TSuit.spades) {
        state.hand.push({ ...treasure, state: TCardState.back });
        const unvisited = [];
        for (let row in state.dungeon) {
            for (let col in state.dungeon[row]) {
                if (
                    state.dungeon[row][col].enemy !== null
                    && !state.dungeon[row][col].hasPlayer
                    && state.dungeon[row][col].enemy.state === TCardState.back
                ) {
                    unvisited.push(state.dungeon[row][col]);
                }
            }
        }
        for (let i = 0; i < config.genieOfDeathMaxKills && unvisited.length > 0; i++) {
            const idx = Math.floor(Math.random() * unvisited.length);
            const chamber = unvisited.splice(idx, 1)[0];
            discardEnemy(chamber, state);
        }
        state.log.push(message.encounter.genie.death(config.genieOfDeathMaxKills));
        return;
    }

    // genie of destiny - performs a spell of God Vision
    if (treasure.rank === TRank.king && treasure.suit === TSuit.clubs) {
        state.hand.push({ ...treasure, state: TCardState.back });
        state.log.push(message.encounter.genie.destiny);
        castGodVision(state);
        return;
    }

    if (treasure.rank === TRank.joker) {
        // put Hebrac card back until it's played
        chamber.enemy = treasure;
        resolveHebrac(chamber, state);
        return;
    }

    alert('You were not supposed to reach this');
    console.debug({ treasure });
};

const discardTreasure = (chamber, state) => {
    if (!chamber.treasure) {
        return;
    }

    state.hand.push({ ...chamber.treasure, state: TCardState.back });
    chamber.treasure = null;
};

const discardEnemy = (chamber, state) => {
    if (!chamber.enemy) {
        return;
    }

    state.hand.push({ ...chamber.enemy, state: TCardState.back });
    chamber.enemy = null;
    chamber.treasure = chamber.treasure === null
        ? null
        : { ...chamber.treasure, state: TCardState.face };

    // TODO: play black magic priestess and Hebrac immediately?
};

const movePlayer = (state, row, column) => {
    state.player.row = row;
    state.player.column = column;

    for (let row in state.dungeon) {
        for (let col in state.dungeon[row]) {
            row = Number(row);
            col = Number(col);
            state.dungeon[row][col].hasPlayer = row === state.player.row && col === state.player.column;
        }
    }
};

const useBagItem = (state, { bagSectionType, bagSectionItemIndex }, { actionType, value }) => {
    const card = state.bag[bagSectionType] ? state.bag[bagSectionType][bagSectionItemIndex] : null;

    if (card) {
        state.hand.push({ ...card, state: TCardState.back });
    }

    switch (actionType) {
        case TBagAction.addGems: {
            state.bag.gems = addGems(state.bag, Number(value));
            break;
        }
        case TBagAction.addMagic: {
            let magicToAdd = Number(value);
            if (state.bag[TCardRole.artifact][TSuit.clubs]) {
                magicToAdd *= 2;
            }
            state.player.magic = addMagic(state.player, magicToAdd);
            break;
        }
        case TBagAction.addHealth: {
            state.player.currentHealth = addHealth(state.player, Number(value));
            break;
        }
        case TBagAction.addStrength: {
            state.player.strength = addStrength(state.player, Number(value));
            break;
        }
        case TBagAction.activatePrisoner: {
            state.player.hasActivePrisoner = true;
            break;
        }
    }

    if (bagSectionType === TCardRole.artifact) {
        state.bag[TCardRole.artifact][bagSectionItemIndex] = null;
        if (bagSectionItemIndex === TSuit.hearts) {
            state.player.maxHealth -= config.rubyOfGazaHealthBonus;
            state.player.currentHealth = Math.min(state.player.currentHealth, state.player.maxHealth);
        }
    } else if (state.bag[bagSectionType]) {
        state.bag[bagSectionType] = state.bag[bagSectionType].filter(
            (_, index) => index !== Number(bagSectionItemIndex),
        );
    }
};

const selectEntrance = async({ dungeon }) => {
    const entranceChambers = [
        dungeon[0][0],
        dungeon[config.dungeonRows - 1][0],
        dungeon[0][config.dungeonColumns - 1],
        dungeon[config.dungeonRows - 1][config.dungeonColumns - 1],
    ];

    return new Promise((resolve) => {
        document.querySelectorAll('.entrance').forEach((entrance) => {
            entrance.addEventListener('click', ({ target }) => {
                entranceChambers.forEach((chamber) => chamber.isEntrance = false);
                const entrance = target.closest('.entrance');
                resolve({ row: Number(entrance.dataset.row), column: Number(entrance.dataset.column) });
            });
        })
    });
};

const attachBagHandlers = (state, renderCallback) => {
    document.querySelectorAll('.bagSection').forEach((bagSection) => {
        bagSection.addEventListener('click', ({ target }) => {
            if (!target.classList.contains('cardAction')) {
                return;
            }

            const cell = target.closest('.bagSection__cell');
            useBagItem(state, cell.dataset, target.dataset);
            renderCallback();
        });
    });
};

const attachPlayerActionSelectorHandlers = ({ actionSelector }, renderCallback) => {
    document.querySelectorAll('.playerAction').forEach((action) => {
        action.addEventListener('click', ({ target }) => {
            actionSelector.actions[target.dataset.uuid].callback();
            renderCallback();
        });
    });
};

const attachDungeonHandlers = (state, loopCallback) => {
    document.querySelectorAll('.chamber').forEach((chamber) => {
        chamber.addEventListener('click', ({ target }) => {
            const chamberEl = target.closest('.chamber');
            const row = Number(chamberEl.dataset.row);
            const col = Number(chamberEl.dataset.column);

            const distance = Math.sqrt(
                (state.player.row - row) ** 2
                + (state.player.column - col) ** 2,
            );

            if (distance <= 1.0) {
                loopCallback(row, col);
            }
        });
    });
};

const attachNextLevelHandlers = (state, renderCallback, loopCallback) => {
    document.querySelector('#nextLevel').addEventListener('click', async ({ target }) => {
        if (target.disabled) {
            return;
        }

        initNextLevel(state);
        renderCallback();

        let { row, column } = await selectEntrance(state);
        state.player.row = row;
        state.player.column = column;
        await loopCallback(row, column);
    });
};

const main = async() => {
    document.title = document.title.replace('{{game.title}}', message.game.title);
    document.querySelector('.copyrightContainer').innerHTML = document.querySelector('.copyrightContainer').innerHTML
        .replace('{{game.title}}', message.game.title)
        .replace('{{game.copyright}}', message.game.copyright);

    let state = {
        ...initField(initEmptyDungeon(), initShuffledDeck()),
        player: initPlayer(),
        log: initLog(),
        bag: initBag(),
        actionSelector: initPlayerActionSelector(),
    };

    const draw = () => {
        renderDungeon(state);
        renderHand(state);
        renderPlayer(state);
        renderLog(state);

        renderPlayerActionSelector(state);
        attachPlayerActionSelectorHandlers(state, draw);

        renderBag(state);
        attachBagHandlers(state, draw);

        renderNextLevel(state);
        attachNextLevelHandlers(state, draw, loop);

        if (state.player.row !== null && state.player.column !== null) {
            attachDungeonHandlers(state, loop);
        }
    };

    const loop = async(playerRow, playerColumn) => {
        if (state.actionSelector.choices.length > 0) return;

        if (state.player.currentHealth <= 0) {
            alert('Game Over! You have lost all your life points.');
            return;
        }

        const artifacts = state.bag[TCardRole.artifact];
        if (artifacts[TSuit.spades] && artifacts[TSuit.hearts] && artifacts[TSuit.diamonds] && artifacts[TSuit.clubs]) {
            alert('Congratulations! You found the four legendary treasures and won the game!');
            return;
        }

        movePlayer(state, playerRow, playerColumn);
        draw();

        const chamber = state.dungeon[playerRow][playerColumn];

        if (chamber.enemy !== null) {
            chamber.enemy.state = TCardState.face;

            switch (chamber.enemy.rank) {
                case TRank.joker:
                    resolveHebrac(chamber, state);
                    break;
                case TRank.ace:
                    discardEnemy(chamber, state);
                    state.log.push(message.encounter.none);
                    break;
                case TRank.king: {
                    const hasItemsToSell = chamber.treasure.suit !== TSuit.diamonds || isNaN(chamber.treasure.rank);
                    if (hasItemsToSell) {
                        state.log.push(message.encounter.merchant.challenge);
                    } else {
                        state.log.push(message.encounter.merchant.waresSold);
                    }

                    setPlayerActionSelector(getMerchantChoices(chamber, state, hasItemsToSell), state.actionSelector);
                    break;
                }
                case TRank.jack:
                    state.log.push(message.encounter.adventurer.challenge);
                    setPlayerActionSelector(getAdventurerChoices(chamber, state, draw), state.actionSelector);
                    break;
                case TRank.queen: {
                    switch (chamber.enemy.suit) {
                        case TSuit.spades:
                        case TSuit.clubs: {
                            const mostValuable = getMostValuableTreasure(state);
                            if (mostValuable) {
                                useBagItem(state, mostValuable.pos, { actionType: null });
                            }
                            state.log.push(message.encounter.blackMagicPriestess.challenge(mostValuable?.card));
                            discardEnemy(chamber, state);
                            break;
                        }
                        default: {
                            state.log.push(message.encounter.whiteMagicPriestess.challenge);
                            setPlayerActionSelector(getWhiteMagicPriestessChoices(chamber, state), state.actionSelector);
                            break;
                        }
                    }
                    break;
                }
                default:
                    state.log.push(message.encounter.regularEnemy(chamber.enemy));
                    setPlayerActionSelector(getEnemyChoices(chamber, state, draw), state.actionSelector);
                    break;
            }
        } else if (chamber.treasure !== null) {
            retrieveTreasure(chamber, state);
        }

        draw();
    };

    draw();

    let { row, column } = await selectEntrance(state);
    state.player.row = row;
    state.player.column = column;
    await loop(row, column);
};
