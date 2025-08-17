document.addEventListener('DOMContentLoaded', () => {
    // === ZOOM PREVENTION CODE ===
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        // Skip prevention for modal buttons
        if (event.target.closest('#modal')) {
            return;
        }
        
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    let lastTap = 0;
    document.addEventListener('touchstart', function(event) {
        // Skip prevention for modal buttons
        if (event.target.closest('#modal')) {
            return;
        }
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            event.preventDefault();
        }
        lastTap = currentTime;
    }, { passive: false });
    
    document.addEventListener('focusin', function(event) {
        if (event.target.tagName === 'INPUT') {
            const viewport = document.querySelector('meta[name="viewport"]');
            const originalContent = viewport.content;
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            
            setTimeout(() => {
                viewport.content = originalContent;
            }, 500);
        }
    });

    // === GAME VARIABLES ===
    let currentNumbers = [];
    let droppedFlag = false;
    let problemCount = 0;
    
    // Question format configuration - cycle through these combinations
    // Each array element is [show_blocks, allow_splitting, generator_function_name]
    let question_format = [
        [1, 1, "generateDoubleDigitsNoCarry"],
        [1, 1, "generateDoublePlusSingleNoCarry"],
        [0, 0, "generateOneMultipleOfTenPlusNonMultiple"],
        [0, 0, "generateDoublePlusSingleNoCarry"]
        ];
    
    // Mapping of generator function names to actual functions
    const generatorFunctions = {
        "generateRandomNumbers": generateRandomNumbers,
        "generateRandomBothDoubleDigits": generateRandomBothDoubleDigits,
        "generateDoubleDigitsNoCarry": generateDoubleDigitsNoCarry,
        "generateBothMultiplesOfTen": generateBothMultiplesOfTen,
        "generateOneMultipleOfTenPlusNonMultiple": generateOneMultipleOfTenPlusNonMultiple,
        "generateDoublePlusSingleWithCarry": generateDoublePlusSingleWithCarry,
        "generateDoublePlusSingleNoCarry": generateDoublePlusSingleNoCarry
    };
    
    // Function to get current settings based on problem count
    function getCurrentSettings() {
        const index = problemCount % question_format.length;
        const [show_blocks, allow_splitting, generator_name] = question_format[index];
        const generator = generatorFunctions[generator_name];
        return { show_blocks, allow_splitting, generator };
    }

    const equationDiv = document.getElementById('equation');
    const modal = document.getElementById('modal');
    const addEquation = document.getElementById('add-equation');
    const answerInput = document.getElementById('answer-input');
    const errorMsg = document.getElementById('error-msg');
    const nextBtn = document.getElementById('next-btn');

    modal.classList.add('hidden');

    // === UTILITY FUNCTIONS ===
    function generateRandomNumbers() {
        const targetSum = Math.floor(Math.random() * 98) + 2;
        const minA = Math.max(1, targetSum - 98);
        const maxA = Math.min(98, targetSum - 1);
        const a = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        const b = targetSum - a;
        return [a, b];
    }

    function generateRandomBothDoubleDigits() {
        let a, b;
        do {
            [a, b] = generateRandomNumbers();
        } while (a < 10 || b < 10);
        
        return [a, b];
    }

    function generateDoubleDigitsNoCarry() {
        let a, b;
        do {
            [a, b] = generateRandomBothDoubleDigits();
        } while ((a % 10) + (b % 10) > 10);
        return [a, b];
    }

    function generateBothMultiplesOfTen() {
        const possibleSums = [20, 30, 40, 50, 60, 70, 80, 90];
        const targetSum = possibleSums[Math.floor(Math.random() * possibleSums.length)];
        
        const validSplits = [];
        for (let a = 10; a <= 90; a += 10) {
            const b = targetSum - a;
            if (b >= 10 && b <= 90 && b % 10 === 0) {
                validSplits.push([a, b]);
            }
        }
        
        return validSplits[Math.floor(Math.random() * validSplits.length)];
    }

    function generateOneMultipleOfTenPlusNonMultiple() {
        let a, b;
        do {
            [a, b] = generateRandomNumbers();
        } while (
            (a % 10 === 0 && b % 10 === 0) || 
            (a % 10 !== 0 && b % 10 !== 0) ||
            a < 10 || 
            b < 10
        );
        return [a, b];
    }

    function generateDoublePlusSingleWithCarry() {
        let a, b;
        do {
            // Generate a number > 10 that's not a multiple of 10
            a = Math.floor(Math.random() * 89) + 11; // 11-99
            while (a % 10 === 0) {
                a = Math.floor(Math.random() * 89) + 11;
            }
            
            // Generate a single digit
            b = Math.floor(Math.random() * 9) + 1; // 1-9
            
            // Check if adding them crosses to the next ten (includes cases that equal 10)
            const onesDigitA = a % 10;
            const crossesTen = (onesDigitA + b) >= 10;
            
            if (crossesTen) {
                break;
            }
        } while (true);
        
        return [a, b];
    }

    function generateDoublePlusSingleNoCarry() {
        let a, b;
        do {
            // Generate a number > 10 that's not a multiple of 10
            a = Math.floor(Math.random() * 89) + 11; // 11-99
            while (a % 10 === 0) {
                a = Math.floor(Math.random() * 89) + 11;
            }
            
            // Generate a single digit
            b = Math.floor(Math.random() * 9) + 1; // 1-9
            
            // Check if adding them does NOT cross to the next ten AND sum is less than 100
            const onesDigitA = a % 10;
            const crossesTen = (onesDigitA + b) > 10;
            const sumLessThan100 = (a + b) < 100;
            
            if (!crossesTen && sumLessThan100) {
                break;
            }
        } while (true);
        
        return [a, b];
    }

    // === MAIN FUNCTIONS ===
    function generateProblem() {
        let a, b;
        const { generator } = getCurrentSettings();
        [a, b] = generator(); // Use the selected generator function
        currentNumbers = [a, b];
        
        document.getElementById('original-equation').textContent = `${a} + ${b} = __`;
        renderEquation();
        
        const { allow_splitting } = getCurrentSettings();
        if (allow_splitting === 1) {
            makeDraggable();
        }
        
        nextBtn.classList.add('hidden');
        modal.classList.add('hidden');
    }

    function renderEquation() {
        equationDiv.innerHTML = '';
        
        const { show_blocks, allow_splitting } = getCurrentSettings();
        
        if (allow_splitting === 0) {
            // Static mode: grayed out numbers + equals + answer circle
            currentNumbers.forEach((num, idx) => {
                if (idx > 0) {
                    const plus = document.createElement('div');
                    plus.className = 'plus';
                    plus.textContent = '+';
                    equationDiv.appendChild(plus);
                }
                
                const circle = document.createElement('div');
                circle.className = 'number-circle grayed';
                circle.dataset.value = num;

                const valueDiv = document.createElement('div');
                valueDiv.className = 'number-value';
                valueDiv.textContent = num;
                circle.appendChild(valueDiv);

                // Add blocks if show_blocks is enabled
                if (show_blocks === 1) {
                    const blocksContainer = document.createElement('div');
                    blocksContainer.className = 'blocks-container';

                    const tens = Math.floor(num / 10);
                    const ones = num % 10;

                    // Add full tens columns
                    for (let i = 0; i < tens; i++) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < 10; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    // Add ones column if any
                    if (ones > 0) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < ones; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    circle.appendChild(blocksContainer);
                }
                
                equationDiv.appendChild(circle);
            });
            
            // Add equals sign and answer circle
            const equals = document.createElement('div');
            equals.className = 'equals';
            equals.textContent = '=';
            equationDiv.appendChild(equals);
            
            const answerCircle = document.createElement('div');
            answerCircle.className = 'number-circle answer-circle';
            answerCircle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            });
            
            const answerValue = document.createElement('div');
            answerValue.className = 'number-value';
            answerValue.textContent = '?';
            answerCircle.appendChild(answerValue);
            
            equationDiv.appendChild(answerCircle);
            
        } else {
            // Interactive mode: draggable functionality
            currentNumbers.forEach((num, idx) => {
                if (idx > 0) {
                    const plus = document.createElement('div');
                    plus.className = 'plus';
                    plus.textContent = '+';
                    equationDiv.appendChild(plus);
                }
                const circle = document.createElement('div');
                circle.className = 'number-circle';
                circle.dataset.value = num;

                const valueDiv = document.createElement('div');
                valueDiv.className = 'number-value';
                valueDiv.textContent = num;
                circle.appendChild(valueDiv);

                // Add blocks based on show_blocks setting
                if (show_blocks === 1) {
                    const blocksContainer = document.createElement('div');
                    blocksContainer.className = 'blocks-container';

                    const tens = Math.floor(num / 10);
                    const ones = num % 10;

                    // Add full tens columns
                    for (let i = 0; i < tens; i++) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < 10; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    // Add ones column if any
                    if (ones > 0) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < ones; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    circle.appendChild(blocksContainer);
                }

                equationDiv.appendChild(circle);
            });
        }
    }

    function makeDraggable() {
        // Make numbers draggable
        interact('.number-circle')
            .draggable({
                inertia: false,
                autoScroll: false,
                listeners: {
                    start(event) {
                        droppedFlag = false;
                        event.target.setAttribute('data-x', 0);
                        event.target.setAttribute('data-y', 0);
                        event.target.style.transform = 'scale(1.1)';
                        event.target.style.zIndex = '1000';
                        event.target.classList.add('dragging');
                    },
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                        target.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(event) {
                        event.target.style.transform = '';
                        event.target.style.zIndex = '';
                        event.target.classList.remove('dragging');
                        if (!droppedFlag) {
                            resetPosition(event.target);
                        }
                    }
                }
            });

        // Add double-tap to split numbers
        document.querySelectorAll('.number-circle').forEach(circle => {
            let tapCount = 0;
            let tapTimer;
            
            const handleTap = function(event) {
                tapCount++;
                
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const num = parseInt(this.querySelector('.number-value').textContent);
                    const idx = currentNumbers.indexOf(num);
                    if (idx !== -1) {
                        const tens = Math.floor(num / 10) * 10;
                        const ones = num % 10;
                        if (tens > 0 && ones > 0) {
                            currentNumbers.splice(idx, 1, tens, ones);
                            renderEquation();
                            makeDraggable();
                        }
                    }
                }
            };
            
            circle.addEventListener('touchstart', handleTap);
            
            circle.addEventListener('dblclick', function(event) {
                event.preventDefault();
                const num = parseInt(this.querySelector('.number-value').textContent);
                const idx = currentNumbers.indexOf(num);
                if (idx !== -1) {
                    const tens = Math.floor(num / 10) * 10;
                    const ones = num % 10;
                    if (tens > 0 && ones > 0) {
                        currentNumbers.splice(idx, 1, tens, ones);
                        renderEquation();
                        makeDraggable();
                    }
                }
            });
        });

        // Make numbers dropzones for other numbers
        interact('.number-circle').dropzone({
            accept: '.number-circle',
            overlap: 'pointer',
            checker: function(dragEvent, event, dropped, dropzone, dropElement, draggable, draggableElement) {
                if (!dropped) return false;
                
                const droppedNum = parseInt(draggableElement.querySelector('.number-value').textContent);
                const targetNum = parseInt(dropElement.querySelector('.number-value').textContent);
                return isAllowedToAdd(droppedNum, targetNum, currentNumbers.length);
            },
            ondragenter: function(event) {
                // Add visual feedback when dragging over valid target
                event.target.classList.add('drag-target');
            },
            ondragleave: function(event) {
                // Remove visual feedback when dragging away
                event.target.classList.remove('drag-target');
            },
            ondrop: function(event) {
                // Remove visual feedback on drop
                event.target.classList.remove('drag-target');
                droppedFlag = true;
                
                const droppedNum = parseInt(event.relatedTarget.querySelector('.number-value').textContent);
                const targetNum = parseInt(event.target.querySelector('.number-value').textContent);
                if (event.relatedTarget !== event.target) {
                    const droppedIdx = currentNumbers.indexOf(droppedNum);
                    let targetIdx = currentNumbers.indexOf(targetNum);
                    
                    if (droppedNum === targetNum && droppedIdx === targetIdx) {
                        targetIdx = currentNumbers.indexOf(targetNum, droppedIdx + 1);
                    }
                    
                    if (droppedIdx < targetIdx) {
                        showPopup(droppedNum, targetNum);
                    } else {
                        showPopup(targetNum, droppedNum);
                    }
                }
                resetPosition(event.relatedTarget);
            }
        });
    }

    function resetPosition(element) {
        element.style.transform = 'translate(0px, 0px)';
        element.setAttribute('data-x', 0);
        element.setAttribute('data-y', 0);
    }

    function isAllowedToAdd(a, b, len) {
        const isMult10 = (n) => n % 10 === 0 && n >= 10;
        const isSingle = (n) => n >= 1 && n <= 9;
        if (isMult10(a) && isMult10(b)) return true;
        if (isSingle(a) && isSingle(b)) return true;
        if (len === 2 && ((isMult10(a) && isSingle(b)) || (isMult10(b) && isSingle(a)))) return true;
        return false;
    }

    function showPopup(a, b) {
        renderModalEquation(a, b);
        answerInput.value = '';
        errorMsg.classList.add('hidden');
        modal.classList.remove('hidden');
        
        const numBtns = document.querySelectorAll('.num-btn');
        numBtns.forEach(btn => {
            btn.onclick = () => {
                answerInput.value += btn.textContent;
            };
        });
        
        document.getElementById('backspace').onclick = () => {
            answerInput.value = answerInput.value.slice(0, -1);
        };
        
        document.getElementById('cancel').onclick = () => {
            modal.classList.add('hidden');
        };
        
        document.getElementById('submit').onclick = () => {
            const ans = parseInt(answerInput.value);
            if (isNaN(ans) || ans !== a + b) {
                errorMsg.classList.remove('hidden');
            } else {
                const sum = a + b;
                const idxA = currentNumbers.indexOf(a);
                let idxB = currentNumbers.indexOf(b);
                
                if (a === b && idxA === idxB) {
                    idxB = currentNumbers.indexOf(b, idxA + 1);
                }
                
                if (idxA !== -1 && idxB !== -1) {
                    const minIdx = Math.min(idxA, idxB);
                    const maxIdx = Math.max(idxA, idxB);
                    currentNumbers.splice(maxIdx, 1);
                    currentNumbers.splice(minIdx, 1, sum);
                    renderEquation();
                    makeDraggable();
                }
                modal.classList.add('hidden');
                checkIfDone();
            }
        };
    }

    function renderModalEquation(a, b) {
        const modalEquationDiv = document.getElementById('modal-equation');
        modalEquationDiv.innerHTML = '';
        
        const { show_blocks } = getCurrentSettings(); // Get current settings
        console.log("renderModalEquation called with show_blocks:", show_blocks);
        
        [a, b].forEach((num, idx) => {
            if (idx > 0) {
                const plus = document.createElement('div');
                plus.className = 'plus';
                plus.textContent = '+';
                modalEquationDiv.appendChild(plus);
            }
            
            const circle = document.createElement('div');
            circle.className = 'number-circle';
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'number-value';
            valueDiv.textContent = num;
            circle.appendChild(valueDiv);
            
            // Only add blocks if show_blocks is enabled
            if (show_blocks === 1) {
                console.log("Adding blocks in renderModalEquation for:", num);
                const blocksContainer = document.createElement('div');
                blocksContainer.className = 'blocks-container';
                
                const tens = Math.floor(num / 10);
                const ones = num % 10;

                // Add full tens columns
                for (let i = 0; i < tens; i++) {
                    const column = document.createElement('div');
                    column.className = 'block-column';
                    for (let j = 0; j < 10; j++) {
                        const block = document.createElement('div');
                        block.className = 'block';
                        column.appendChild(block);
                    }
                    blocksContainer.appendChild(column);
                }

                // Add ones column if any
                if (ones > 0) {
                    const column = document.createElement('div');
                    column.className = 'block-column';
                    for (let j = 0; j < ones; j++) {
                        const block = document.createElement('div');
                        block.className = 'block';
                        column.appendChild(block);
                    }
                    blocksContainer.appendChild(column);
                }

                circle.appendChild(blocksContainer);
            } else {
                console.log("NOT adding blocks in renderModalEquation because show_blocks =", show_blocks);
            }
            
            modalEquationDiv.appendChild(circle);
        });
    }

    function checkIfDone() {
        if (currentNumbers.length === 1) {
            // Increment completed counter
            problemCount++;
            document.getElementById('problem-counter').textContent = `Completed: ${problemCount}`;
            
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            nextBtn.classList.remove('hidden');
        }
    }

    function openModal() {
        const sum = currentNumbers.reduce((a, b) => a + b, 0);
        const { show_blocks } = getCurrentSettings();
        
        console.log("openModal called with show_blocks:", show_blocks);
        
        const modalEquationDiv = document.getElementById('modal-equation');
        if (modalEquationDiv) {
            modalEquationDiv.innerHTML = '';
            
            // Create the same visual representation as the main screen
            currentNumbers.forEach((num, idx) => {
                if (idx > 0) {
                    const plus = document.createElement('div');
                    plus.className = 'plus';
                    plus.textContent = '+';
                    modalEquationDiv.appendChild(plus);
                }
                
                const circle = document.createElement('div');
                circle.className = 'number-circle grayed';
                
                const valueDiv = document.createElement('div');
                valueDiv.className = 'number-value';
                valueDiv.textContent = num;
                circle.appendChild(valueDiv);
                
                // Add blocks ONLY if show_blocks is enabled
                if (show_blocks === 1) {
                    console.log("Adding blocks for number:", num);
                    const blocksContainer = document.createElement('div');
                    blocksContainer.className = 'blocks-container';

                    const tens = Math.floor(num / 10);
                    const ones = num % 10;

                    // Add tens columns
                    for (let i = 0; i < tens; i++) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < 10; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    // Add ones column
                    if (ones > 0) {
                        const column = document.createElement('div');
                        column.className = 'block-column';
                        for (let j = 0; j < ones; j++) {
                            const block = document.createElement('div');
                            block.className = 'block';
                            column.appendChild(block);
                        }
                        blocksContainer.appendChild(column);
                    }

                    circle.appendChild(blocksContainer);
                } else {
                    console.log("NOT adding blocks for number:", num, "because show_blocks =", show_blocks);
                }
                
                modalEquationDiv.appendChild(circle);
            });
        }
        
        modal.classList.remove('hidden');
        answerInput.value = '';
        errorMsg.classList.add('hidden');
        
        setupModalEventListeners(sum);
    }

    function setupModalEventListeners(expectedSum) {
        console.log("Setting up modal event listeners for sum:", expectedSum);
        
        // Set up numpad buttons
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                answerInput.value += btn.textContent;
                console.log("Number clicked:", btn.textContent, "Current value:", answerInput.value);
            };
        });
        
        // Set up backspace
        document.getElementById('backspace').onclick = (e) => {
            e.preventDefault();
            answerInput.value = answerInput.value.slice(0, -1);
            console.log("Backspace clicked, current value:", answerInput.value);
        };
        
        // Set up cancel
        document.getElementById('cancel').onclick = (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
            console.log("Cancel clicked");
        };
        
        // Set up submit
        document.getElementById('submit').onclick = (e) => {
            e.preventDefault();
            const ans = parseInt(answerInput.value);
            console.log("Submit clicked, answer:", ans, "expected:", expectedSum);
            
            if (isNaN(ans) || ans !== expectedSum) {
                errorMsg.classList.remove('hidden');
                console.log("Wrong answer");
            } else {
                // Correct answer - replace the question mark circle with the answer
                replaceAnswerCircle(expectedSum);
                
                modal.classList.add('hidden');
                nextBtn.classList.remove('hidden');
                
                // Increment completed counter
                problemCount++;
                document.getElementById('problem-counter').textContent = `Completed: ${problemCount}`;
                
                console.log("Correct answer! Showing confetti");
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        };
    }

    function replaceAnswerCircle(answer) {
        // Find the answer circle (the one with "?")
        const answerCircle = document.querySelector('.answer-circle');
        
        if (answerCircle) {
            // Remove the answer-circle class and add grayed class
            answerCircle.classList.remove('answer-circle');
            answerCircle.classList.add('grayed');
            
            // Remove click handler by cloning the element
            const newAnswerCircle = answerCircle.cloneNode(true);
            answerCircle.parentNode.replaceChild(newAnswerCircle, answerCircle);
            
            // Now update the text content in the NEW element
            const valueDiv = newAnswerCircle.querySelector('.number-value');
            if (valueDiv) {
                valueDiv.textContent = answer;
                console.log("Updated text to:", answer);
            } else {
                console.error("Could not find .number-value in the answer circle");
            }
            
            console.log("Replaced answer circle with answer:", answer);
        } else {
            console.error("Could not find .answer-circle element");
        }
    }

    // === EVENT HANDLERS ===
    nextBtn.onclick = () => {
        generateProblem();
    };

    // === INITIALIZATION ===
    problemCount = 0;
    document.getElementById('problem-counter').textContent = `Completed: ${problemCount}`;
    generateProblem();
});

