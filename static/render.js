const renderCard = (card, role = '') => {
    return `<div class="card"
        data-rank="${card.rank}"
        data-suit="${card.suit}"
        data-state="${card.state}"
        ${role ? `data-role="${role}"` : ''}
    ></div>`;
};

const renderCardActions = ({ rank }, role) => {
    switch (role) {
        case TCardRole.lifePotion:
            return `<div class="cardActionContainer">
                <button class="cardAction" data-action-type="${TBagAction.addHealth}" data-value="${rank}" title="${message.bag.action.addHealth(rank)}"></button>
                <button class="cardAction" data-action-type="${TBagAction.addGems}" data-value="${rank}" title="${message.bag.action.addGems(rank)}"></button>
            </div>`;
        case TCardRole.strengthPotion:
            return `<div class="cardActionContainer">
                <button class="cardAction" data-action-type="${TBagAction.addGems}" data-value="${rank}" title="${message.bag.action.addGems(rank)}"></button>
            </div>`;
        case TCardRole.magicPotion:
            return `<div class="cardActionContainer">
                <button class="cardAction" data-action-type="${TBagAction.addMagic}" data-value="${rank}" title="${message.bag.action.addMagic(rank)}"></button>
                <button class="cardAction" data-action-type="${TBagAction.addGems}" data-value="${2 * rank}" title="${message.bag.action.addGems(2 * rank)}"></button>
            </div>`;
        case TCardRole.prisoner:
            return `<div class="cardActionContainer">
                <button class="cardAction" data-action-type="${TBagAction.addGems}" data-value="8" title="${message.bag.action.addGems(8)}"></button>
            </div>`;
        case TCardRole.artifact:
            return `<div class="cardActionContainer">
                <button class="cardAction" data-action-type="${TBagAction.addGems}" data-value="12" title="${message.bag.action.addGems(12)}"></button>
            </div>`;
        default:
            return '';
    }
};

const getGemCount = (gems, hasTheBagOfMeres) => {
    return hasTheBagOfMeres
        ? Infinity
        : gems;
};

const renderPlayer = ({ player: { currentHealth, maxHealth, magic }, bag }) => {
    const gemCount = getGemCount(bag.gems, !!bag[TCardRole.artifact][TSuit.diamonds]);
    document.querySelector('#player').innerHTML = `
        <div class="health">
            <div class="health__count">${currentHealth}/${maxHealth}</div>
        </div>
        <div class="magic">
            <div class="magic__count">${magic}</div>
        </div>
        <div class="gems">
            <div class="gems__count">${gemCount === Infinity ? message.bag.infiniteGems: gemCount}</div>
        </div>`;
};

const renderEntrance = (row, column) => {
    return `<div class="entrance" data-row="${row}" data-column="${column}">
        <div class="entrance__description">
            ${message.entrance.startHere}
        </div>
    </div>`;
};

const renderHand = ({ hand }) => {
    let html = '';
    if (hand.length > 0) {
        html += renderCard(hand[0]);
    }

    document.querySelector('#hand').innerHTML = html;
};

const renderDungeon = ({ dungeon }) => {
    let html = '';
    for (let row in dungeon) {
        for (let col in dungeon[row]) {
            const chamber = dungeon[row][col];
            html += `
                <div class="chamber ${chamber.isEntrance ? 'chamber--entrance' : ''} ${chamber.hasPlayer ? 'chamber--player' : ''}" 
                    data-row="${row}" 
                    data-column="${col}"
                >
                    ${chamber.treasure && !chamber.isEntrance ? renderCard(chamber.treasure, TCardRole.treasure) : ''}
                    ${chamber.enemy && !chamber.isEntrance ? renderCard(chamber.enemy, TCardRole.enemy) : ''}
                    ${chamber.isEntrance ? renderEntrance(row, col) : ''}
                </div>`;
        }
    }

    document.querySelector('#dungeon').innerHTML = html;
};

const renderLog = ({ log }) => {
    const $log = document.querySelector('#log');
    $log.innerHTML = `<p>${log.join('</p><p>')}</p>`;
    $log.scrollTo(0, $log.scrollHeight);
};

const renderAction = (action) => {
    return `<button class="playerAction" data-uuid="${action.uuid}">${action.text}</button>`;
};

const renderBag = ({ bag }) => {
    let html = `
        <div class="bagSection bagSection--artifacts"
            title="${message.bag[TCardRole.artifact]}"
        >${Object.values(bag[TCardRole.artifact]).filter(card => !!card).reduce((html, card) =>
            `${html}
            <div class="bagSection__cell" 
                data-bag-section-type="${TCardRole.artifact}"
                data-bag-section-item-index="${card.suit}"
            >${
                renderCard(card, TCardRole.artifact)
            }${
                renderCardActions(card, TCardRole.artifact)
            }</div>`,
            ''
        )}</div>`;

    for (const bagType of [TCardRole.prisoner, TCardRole.lifePotion, TCardRole.magicPotion, TCardRole.strengthPotion]) {
        html = `${html}
            <div class="bagSection bagSection--${bagType}"
                title="${message.bag[bagType]}"
            >${bag[bagType].reduce((html, card, index) =>
                `${html}
                <div class="bagSection__cell"
                    data-bag-section-type="${bagType}"
                    data-bag-section-item-index="${index}"
                >${
                    renderCard(card, bagType)
                }${
                    renderCardActions(card, bagType)
                }</div>`,
                ''
            )}</div>`;
    }

    document.querySelector('#bag').innerHTML = html;
};

const renderPlayerActionSelector = ({ actionSelector: { actions } }) => {
    const html = Object.entries(actions).reduce((html, action) => `${html}${renderAction(action[1])}`, '');
    if (html === '') {
        return;
    }

    const $log = document.querySelector('#log');
    $log.innerHTML = `${$log.innerHTML}<p>${html}</p>`;

    $log.scrollTo(0, $log.scrollHeight);
};
