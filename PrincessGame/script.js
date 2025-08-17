// Variables
let startingNumber;
let numberToAdd;
let currentNumber;
let finalNumber;
let score = 0;

// Elements
const numberBoard = document.getElementById('number-board');
const problemElement = document.getElementById('problem');
const tensTilesContainer = document.getElementById('tens-tiles');
const onesTilesContainer = document.getElementById('ones-tiles');
const scoreElement = document.getElementById('score');
const character = document.getElementById('character');

// Initialize the game
initializeGame();

function initializeGame() {
    generateNumbers();
    // Display the problem
    problemElement.innerText = `Add ${startingNumber} + ${numberToAdd}`;

    // Create the 100 board
    createNumberBoard();

    // Highlight the starting number tiles
    highlightTiles(1, startingNumber, 'highlighted');

    // Move character to starting position
    moveCharacterToTile(startingNumber);

    // Create the draggable tiles for the number to add
    createDraggableTiles();

    // Update score
    updateScore();
}

function generateNumbers() {
    startingNumber = Math.floor(Math.random() * 80) + 1; // Random starting number between 1 and 80
    let maxAdd = 100 - startingNumber;
    numberToAdd = Math.floor(Math.random() * maxAdd) + 1; // Generate based on maxAdd
    while (startingNumber + numberToAdd > 100) {
        numberToAdd = Math.floor(Math.random() * maxAdd) + 1;
    }

    finalNumber = startingNumber + numberToAdd;
    currentNumber = startingNumber;
}

function createNumberBoard() {
    numberBoard.innerHTML = '';
    for (let i = 1; i <= 100; i++) {
        let tile = document.createElement('div');
        tile.classList.add('tile', 'number-tile');
        tile.innerText = i;
        tile.id = 'tile-' + i;
        numberBoard.appendChild(tile);
    }
}

function highlightTiles(start, end, className) {
    for (let i = start; i <= end && i <= 100; i++) {
        let tile = document.getElementById('tile-' + i);
        if (tile) {
            tile.classList.add(className);
        }
    }
}

function createDraggableTiles() {
    tensTilesContainer.innerHTML = '';
    onesTilesContainer.innerHTML = '';

    // Create two rows for tens tiles
    for (let row = 0; row < 2; row++) {
        let rowDiv = document.createElement('div');
        rowDiv.classList.add('tile-row');
        for (let i = 0; i < 5; i++) {
            let tile = document.createElement('div');
            tile.classList.add('draggable-tile', 'tens-tile');
            tile.innerText = '10';
            tile.id = 'tens-tile-' + (row * 5 + i);
            addDragEvents(tile);
            rowDiv.appendChild(tile);
        }
        tensTilesContainer.appendChild(rowDiv);
    }

    // Create two rows for ones tiles
    for (let row = 0; row < 2; row++) {
        let rowDiv = document.createElement('div');
        rowDiv.classList.add('tile-row');
        for (let i = 0; i < 5; i++) {
            let tile = document.createElement('div');
            tile.classList.add('draggable-tile', 'ones-tile');
            tile.innerText = '1';
            tile.id = 'ones-tile-' + (row * 5 + i);
            addDragEvents(tile);
            rowDiv.appendChild(tile);
        }
        onesTilesContainer.appendChild(rowDiv);
    }
}

function addDragEvents(element) {
    interact(element).draggable({
        inertia: true,
        autoScroll: true,
        listeners: {
            start(event) {
                event.target.classList.add('dragging');
            },
            move: dragMoveListener,
            end(event) {
                event.target.classList.remove('dragging');

                // If the tile was not dropped onto the number board, reset its position
                if (!event.target.classList.contains('can-drop')) {
                    // Return to original position
                    event.target.style.transform = 'translate(0px, 0px)';
                    event.target.setAttribute('data-x', 0);
                    event.target.setAttribute('data-y', 0);
                }

                // Remove 'can-drop' class
                event.target.classList.remove('can-drop');
            }
        }
    });
}

function dragMoveListener(event) {
    const target = event.target;

    // Keep the dragged position in the data-x/data-y attributes
    const dataX = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const dataY = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Translate the element
    target.style.transform = `translate(${dataX}px, ${dataY}px)`;

    // Update the position attributes
    target.setAttribute('data-x', dataX);
    target.setAttribute('data-y', dataY);
}

// Set up the number board as a dropzone
interact('#number-board').dropzone({
    accept: '.draggable-tile', // Accept elements with this class
    overlap: 0.5, // Require 50% overlap to consider a drop
    ondropactivate(event) {
        event.target.classList.add('drop-active');
    },
    ondragenter(event) {
        const draggableElement = event.relatedTarget;
        const dropzoneElement = event.target;
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
        draggableElement.classList.remove('drag-reject');
    },
    ondragleave(event) {
        event.target.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
        event.relatedTarget.classList.add('drag-reject');
    },
    ondrop(event) {
        const draggableElement = event.relatedTarget;
        // Add to board when dropped
        addToBoard(parseInt(draggableElement.innerText), draggableElement.id);
    },
    ondropdeactivate(event) {
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
    }
});

function showError() {
    numberBoard.classList.add('error');
    setTimeout(() => {
        numberBoard.classList.remove('error');
    }, 500);
}

function addToBoard(value, elementId) {
    if (currentNumber + value > finalNumber) {
        showError();
        return;
    }

    let start = currentNumber + 1;
    let end = currentNumber + value;
    highlightTiles(start, end, 'highlighted-added');
    currentNumber += value;

    moveCharacterToTile(currentNumber);

    let tile = document.getElementById(elementId);
    if (tile) {
        tile.classList.add('used');
        tile.style.transform = 'translate(0px, 0px)';
        tile.setAttribute('data-x', 0);
        tile.setAttribute('data-y', 0);
        // Disable further dragging
        interact(tile).draggable(false);
    }

    playSound();

    if (currentNumber === finalNumber) {
        score += 10;
        updateScore();

        setTimeout(() => {
            alert(`Great job! ${startingNumber} + ${numberToAdd} = ${finalNumber}`);
            resetGame();
        }, 500);
    }
}

function playSound() {
    // Play a sound effect when a tile is dropped
    let audio = new Audio('assets/drop.wav'); // Ensure you have a sound file at this path
    audio.play();
}

function moveCharacterToTile(tileNumber) {
    let tile = document.getElementById('tile-' + tileNumber);
    if (tile) {
        let rect = tile.getBoundingClientRect();
        let boardRect = numberBoard.getBoundingClientRect();

        let left = rect.left - boardRect.left;
        let top = rect.top - boardRect.top;

        character.style.left = left + 'px';
        character.style.top = top + 'px';
    }
}

function updateScore() {
    scoreElement.innerText = score;
}

function resetGame() {
    // Reset all tiles to their original state
    const allTiles = document.querySelectorAll('.draggable-tile');
    allTiles.forEach(tile => {
        tile.classList.remove('used');
        tile.style.transform = 'translate(0px, 0px)';
        tile.setAttribute('data-x', 0);
        tile.setAttribute('data-y', 0);
        // Re-enable dragging
        interact(tile).draggable(true);
    });

    initializeGame();
}
