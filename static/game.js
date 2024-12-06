const setPlayerActionSelector = (choices, actionSelector) => {
    actionSelector.choices = choices;
    actionSelector.actions = {};
    for (let choice of choices) {
        const uuid = crypto.randomUUID();
        actionSelector.actions[uuid] = {
            uuid,
            ...choice,
            callback: () => {
                choice.callback();
                actionSelector.choices = [];
                actionSelector.actions = {};
            }
        };
    }
};

const addGems = ({ gems }, value) => {
    return gems + value;
};

const addMagic = ({ magic }, value ) => {
    return magic + value;
};

const addHealth = ({ currentHealth, maxHealth }, value) => {
    return Math.min(maxHealth, currentHealth + value);
};

const retrieveTreasure = (chamber, state) => {
    const treasure = chamber.treasure;
    chamber.treasure = null;

    console.debug(`${chamber.row}:${chamber.column}: ${treasure.rank} of ${treasure.suit}`);

    // TODO: artifacts
    if (treasure.rank === TRank.ace) {
        if (state.bag[TCardRole.artifact][treasure.suit] !== null) {
            state.log.push(message.treasure.fakeArtifact)
            state.hand.push({ ...treasure, state: TCardState.back });
            return;
        }

        if (treasure.suit === TSuit.hearts) {
            state.player.maxHealth += 5;
            return;
        }

        state.bag[TCardRole.artifact][treasure.suit] = { ...treasure, state: TCardState.face };
        return;
    }

    // life potion
    if (treasure.suit === TSuit.hearts && !isNaN(treasure.rank)) {
        state.bag[TCardRole.lifePotion].push({ ...treasure, state: TCardState.face });
        return;
    }

    // gems
    if (treasure.suit === TSuit.diamonds && !isNaN(treasure.rank)) {
        state.bag.gems = addGems(state.bag, treasure.rank);
        return;
    }

    // strength potion
    if (treasure.suit === TSuit.spades && !isNaN(treasure.rank)) {
        state.bag[TCardRole.strengthPotion].push({ ...treasure, state: TCardState.face });
        return;
    }

    // magic potion
    if (treasure.suit === TSuit.clubs && !isNaN(treasure.rank)) {
        state.bag[TCardRole.magicPotion].push({ ...treasure, state: TCardState.face });
        return;
    }

    // prisoner - joins player
    if (treasure.rank === TRank.jack) {
        state.bag[TCardRole.prisoner].push({ ...treasure, state: TCardState.face });
        return;
    }

    // white magic priestess - heals player
    if (treasure.rank === TRank.queen && [TSuit.diamonds, TSuit.hearts].includes(treasure.suit)) {
        state.hand.push({ ...treasure, state: TCardState.back });
        state.player.currentHealth = addHealth(state.player, state.player.maxHealth);
        return;
    }

    // TODO: black magic priestess - steals least precious treasure from player
    if (treasure.rank === TRank.queen && [TSuit.spades, TSuit.clubs].includes(treasure.suit)) {
        state.hand.push({ ...treasure, state: TCardState.back });
        return;
    }

    // genie of life - increases max HP
    if (treasure.rank === TRank.king && treasure.suit === TSuit.hearts) {
        state.hand.push({ ...treasure, state: TCardState.back });
        state.player.maxHealth += 2;
        return;
    }

    // TODO: genie of luck - gives three treasure cards
    if (treasure.rank === TRank.king && treasure.suit === TSuit.diamonds) {
        state.hand.push({ ...treasure, state: TCardState.back });
        return;
    }

    // TODO: genie of death - destroys three enemy cards among those that lie in chambers you have not yet visited
    if (treasure.rank === TRank.king && treasure.suit === TSuit.spades) {
        state.hand.push({ ...treasure, state: TCardState.back });
        return;
    }

    // TODO: genie of destiny - performs a spell of God Vision
    if (treasure.rank === TRank.king && treasure.suit === TSuit.clubs) {
        state.hand.push({ ...treasure, state: TCardState.back });
        return;
    }

    // TODO: Hebrac - play a game
    if (treasure.rank === TRank.joker) {
        return;
    }

    alert('You were not supposed to reach this');
    console.debug({ treasure });
};

const discardTreasure = (chamber, state) => {
    state.hand.push({ ...chamber.treasure, state: TCardState.back });
    chamber.treasure = null;
};

const discardEnemy = (chamber, state) => {
    state.hand.push({ ...chamber.enemy, state: TCardState.back });
    chamber.enemy = null;
    chamber.treasure = chamber.treasure === null
        ? null
        : { ...chamber.treasure, state: TCardState.face };
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
    const card = state.bag[bagSectionType][bagSectionItemIndex];

    state.hand.push({ card, state: TCardState.back });

    switch (actionType) {
        case TBagAction.addGems: {
            state.bag.gems = addGems(state.bag, Number(value));
            break;
        }
        case TBagAction.addMagic: {
            state.player.magic = addMagic(state.player, Number(value));
            break;
        }
        case TBagAction.addHealth: {
            state.player.currentHealth = addHealth(state.player, Number(value));
            break;
        }
    }

    if (card.rank === TRank.ace) {
        state.bag[TCardRole.artifact][card.suit] = null;
    } else {
        state.bag[bagSectionType] = state.bag[bagSectionType].filter(
            (_, index) => index !== Number(bagSectionItemIndex)
        );
    }
};

const selectEntrance = async({ dungeon }) => {
    const entranceChambers = [
        dungeon[0][0],
        dungeon[config.dungeonRows - 1][0],
        dungeon[0][config.dungeonColumns - 1],
        dungeon[config.dungeonRows - 1][config.dungeonColumns - 1]
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

const main = async() => {
    document.title = message.game.title;

    let state = {
        ...initField(initEmptyDungeon(), initShuffledDeck()),
        player: initPlayer(),
        log: initLog(),
        bag: initBag(),
        actionSelector: initPlayerActionSelector()
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
    };

    const loop = async(playerRow, playerColumn) => {
        movePlayer(state, playerRow, playerColumn);

        for (let row in state.dungeon) {
            for (let col in state.dungeon[row]) {
                row = Number(row);
                col = Number(col);
                let chamber = state.dungeon[row][col];

                if (!chamber.hasPlayer) {
                    continue;
                }

                if (chamber.enemy !== null) {
                    chamber.enemy.state = TCardState.face;

                    switch (chamber.enemy.rank) {
                        // TODO: Hebrac: play game or decline
                        case TRank.joker:
                            state.log.push(message.encounter.hebrac.challenge);
                            break;
                        case TRank.ace:
                            state.log.push(message.encounter.none);
                            discardEnemy(chamber, state);
                            break;
                        // TODO: Merchant: trade, steal or ignore
                        case TRank.king: {
                            if (chamber.treasure.suit === TSuit.diamonds && !isNaN(chamber.treasure.rank)) {
                                state.log.push(message.encounter.merchant.waresSold);
                                // TODO: Handle steal
                                discardTreasure(chamber, state);
                                break;
                            }

                            state.log.push(message.encounter.merchant.challenge);
                            discardEnemy(chamber, state);
                            setPlayerActionSelector(getMerchantChoices(chamber, state), state.actionSelector);
                            break;
                        }
                        case TRank.jack:
                            state.log.push(message.encounter.adventurer.challenge);
                            setPlayerActionSelector(getAdventurerChoices(chamber, state), state.actionSelector);
                            break;
                        case TRank.queen: {
                            switch (chamber.enemy.suit) {
                                // TODO: Black magic priestess: steal most valuable treasure
                                case TSuit.spades:
                                case TSuit.clubs:
                                    state.log.push(message.encounter.blackMagicPriestess());
                                    discardEnemy(chamber, state);
                                    break;
                                default:
                                    discardEnemy(chamber, state);
                                    state.log.push(message.encounter.whiteMagicPriestess.challenge);
                                    setPlayerActionSelector(getWhiteMagicPriestessChoices(chamber, state), state.actionSelector);
                                    break;
                            }
                            break;
                        }
                        // TODO: Enemy: fight or flee
                        default:
                            state.log.push(message.encounter.regularEnemy(chamber.enemy));
                            break;
                    }

                    state.dungeon[row][col] = chamber;
                }
                draw();

                await (async () => {
                    return new Promise((resolve) => {
                        setInterval(() => {
                            if (state.actionSelector.choices.length === 0) {
                                resolve();
                            }
                        }, 1);
                    })
                })();

                if (chamber.enemy === null && chamber.treasure !== null) {
                    retrieveTreasure(chamber, state);
                }
                state.dungeon[row][col] = chamber;
                draw();
            }
        }
    };

    draw();
    let { row, column } = await selectEntrance(state);

    for (let row in state.dungeon) {
        for (let column in state.dungeon[row]) {
            row = Number(row);
            column = Number(column);
            await loop(row, column);
        }
    }
};
