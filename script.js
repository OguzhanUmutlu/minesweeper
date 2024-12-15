const options = {rows: 16, cols: 16, mines: 24};

const cells = [];
let gameOver = false;
let endingMine = null;

const picker = document.querySelector(".game-picker");

const youWin = document.querySelector(".you-win-container");
const playAgain = document.getElementById("play-again");
const preload = document.querySelector(".preload");
const cellsContainer = document.querySelector(".cells-container");
const cellsDiv = document.querySelector(".cells");
const startBtn = document.getElementById("start");
let viewMines = false;

for (const k in options) {
    const input = document.getElementById(k);
    input.value = options[k];
    const value = document.getElementById(`${k}-value`);
    value.innerText = `(${input.value})`;

    input.addEventListener("input", () => {
        options[k] = input.value;
        value.innerText = `(${input.value})`;
    });
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

for (const asset of [
    "1", "2", "3", "4", "5", "6", "7", "8", "closed_cell", "empty_cell", "flag_cell", "mine_cell", "red_mine"
]) {
    const img = document.createElement("img");
    img.src = `./assets/${asset}.png`;
    preload.appendChild(img);
}

function updateCell(cell) {
    let image = "closed_cell";

    if (cell.isRevealed || (viewMines && cell.isMine) || gameOver) {
        if (cell.isMine) image = endingMine === cell ? "red_mine" : "mine_cell";
        else if (cell.isFlagged) image = "flag_cell";
        else if (cell.value !== 0) image = cell.value;
        else image = "empty_cell";
    } else if (cell.isFlagged) {
        image = "flag_cell";
    }

    cell.div.style.backgroundImage = `url(./assets/${image}.png)`;
    cell.div.style.cursor = cell.isRevealed ? "default" : "pointer";
}

function updateAllCells() {
    for (let x = 0; x < options.rows; x++) {
        for (let y = 0; y < options.cols; y++) {
            updateCell(getCell(x, y));
        }
    }
}

function getCell(x, y) {
    return cells.find(i => i.x === x && i.y === y);
}

function spreadAt(cell) {
    cell.isRevealed = true;
    updateCell(cell);
    for (const [dx, dy] of [
        [0, 0], [0, 1], [1, 0], [-1, 0], [0, -1]
    ]) {
        const cell2 = getCell(cell.x + dx, cell.y + dy);
        if (!cell2 || cell2.isMine || cell2.value > 0 || cell2.isRevealed) continue;
        spreadAt(cell2);
    }
}

startBtn.addEventListener("click", async () => {
    cells.length = 0;
    cellsDiv.innerHTML = "";
    gameOver = false;
    endingMine = null;
    picker.classList.add("picker-fade");

    for (let x = 0; x < options.rows; x++) {
        for (let y = 0; y < options.cols; y++) {
            cells.push({
                x, y,
                value: 0,
                isMine: false,
                isRevealed: false,
                isFlagged: false
            });
        }
    }

    const cellsCopy = [...cells];

    for (let i = 0; i < options.mines; i++) {
        const randomIndex = Math.floor(Math.random() * cellsCopy.length);
        const cell = cellsCopy.splice(randomIndex, 1)[0];
        cell.isMine = true;
        const {x, y} = cell;
        for (let x0 = x - 1; x0 <= x + 1; x0++) {
            for (let y0 = y - 1; y0 <= y + 1; y0++) {
                const cell = getCell(x0, y0);
                if (cell) cell.value++;
            }
        }
    }

    picker.classList.add("picker-fade");

    cellsDiv.innerHTML = "";

    cellsContainer.style.aspectRatio = `${options.rows} / ${options.cols}`;

    for (let x = 0; x < options.rows; x++) {
        for (let y = 0; y < options.cols; y++) {
            const cell = getCell(x, y);

            cell.div = document.createElement("div");

            cell.div.classList.add("cell");
            cell.div.style.width = `calc(100% / ${options.rows})`;

            cell.div.addEventListener("click", () => {
                if (cell.isFlagged || cell.isRevealed) return;
                if (cell.isMine) {
                    gameOver = true;
                    endingMine = cell;
                    updateAllCells();
                    return;
                }

                if (cell.value === 0) {
                    spreadAt(cell);
                    return;
                }

                cell.isRevealed = true;
                updateCell(cell);
            });

            cell.div.addEventListener("contextmenu", e => {
                e.preventDefault();
                if (cell.isRevealed) return;
                cell.isFlagged = !cell.isFlagged;

                // now it's flagged, check if every mine is flagged and that they have the same count
                const flags = cells.filter(i => i.isFlagged);
                if (flags.length === options.mines && flags.every(i => i.isMine)) {
                    gameOver = true;
                    updateAllCells();
                    youWin.classList.add("you-win-reveal");
                    return;
                }

                updateCell(cell);
            });

            cellsDiv.appendChild(cell.div);
        }
    }

    updateAllCells();

    await wait(500);
    cellsContainer.classList.add("cells-visible");
});

playAgain.addEventListener("click", () => {
    youWin.classList.remove("you-win-reveal");
    picker.classList.remove("picker-fade");
    cellsContainer.classList.remove("cells-visible");
});