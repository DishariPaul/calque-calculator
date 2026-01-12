const toggle = document.getElementById("themeToggle");
const root = document.documentElement;
const display = document.getElementById("display");
const historyPanel = document.getElementById("historyPanel");
const historyToggle = document.getElementById("historyToggle");
const clickSound = new Audio("click.wav");  clickSound.volume = 0.8;
const sciToggle = document.getElementById("sciToggle");
const scientificPanel = document.querySelector(".scientific");
let soundEnabled = true;
let historyData = JSON.parse(localStorage.getItem("calcHistory")) || [];    //this loads the previous history if exists or else start with an empty array

//for power function
let powerBase = null;
let waitingForExponent = false;

/*--SCREEN THEME--*/
// load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  root.setAttribute("data-theme", "dark");
  toggle.textContent = "☀️";
  toggle.setAttribute("aria-pressed", "true");
}
// toggle on click
toggle.addEventListener("click", () => {
  playClickSound();
  const isDark = root.hasAttribute("data-theme");
  if (isDark) {
    root.removeAttribute("data-theme");
    toggle.textContent = "🌙";
    toggle.setAttribute("aria-pressed", "false");
    localStorage.setItem("theme", "light");
  } else {
    root.setAttribute("data-theme", "dark");
    toggle.textContent = "☀️";
    toggle.setAttribute("aria-pressed", "true");
    localStorage.setItem("theme", "dark");
  }
});

//to avoid html syntax error for '('/')' while using appendtoDisplay 
document.querySelectorAll(".paren").forEach(btn => {
  btn.addEventListener("click", () => {
    appendtoDisplay(btn.dataset.value);
  });
});

sciToggle.addEventListener("click", () => {
  playClickSound()
  scientificPanel.classList.toggle("hidden");
});

/*--SOUND FUNCTION--*/
function playClickSound(){
  if (!soundEnabled) return;
  clickSound.currentTime = 0;
  clickSound.play();
}
var clickBtn = document.getElementById("soundToggle");
clickBtn.onclick = () => {
  soundEnabled = !soundEnabled;
  if (clickBtn.textContent === "🔊"){
    clickBtn.textContent = "🔇";
  }
  else{
    playClickSound();
    clickBtn.textContent = "🔊";
  }
};


/*--HISTORY PANEL--*/
//clear history option
document.getElementById("clearHistory").addEventListener("click", () => {
  historyData = [];
  localStorage.removeItem("calcHistory");
  renderHistory();
});
//working of history panel button
historyToggle.addEventListener("click", () => {
  playClickSound();
  historyPanel.classList.toggle("open");
});
//function for handling the UI updates on the history panel
function renderHistory() {
  const group = document.querySelector(".hp-group");
  if (!group) return; //prevent any errors
  group.innerHTML = "";   //clean UI, removes any previous ones on re-render
  let lastDateLabel = null; //keeps track of the previous date group
  historyData.forEach((entry, index) => {
    const dateLabel = getDateLabel(entry.date);   //determine the date label (Today / Yesterday / Date)
    //insert date heading only when date changes
    if (dateLabel !== lastDateLabel) {
      const dateEl = document.createElement("p");
      dateEl.className = "hp-date";
      dateEl.textContent = dateLabel;
      group.appendChild(dateEl);
      lastDateLabel = dateLabel;
    }
    const item = document.createElement("div");
    item.className = "hp-item";
    item.innerHTML = `
      <span class="hp-exp">${entry.expression}</span>
      <span class="hp-res">${entry.result}</span>
      <div class="hp-actions">
        <button class="hp-copy" title="Copy to Clipboard">📋</button>
        <button class="hp-remove" title="Remove">✕</button>
      </div>
    `;
    /*on clicking a row → reuse/replace the result on the display*/
    item.onclick = () => {display.value = entry.result;};
    /* copy button */
    item.querySelector(".hp-copy").onclick = (e) => {   //e is the click event -->  what, where, how an object was clicked
      e.stopPropagation(); /* IMPORTANT because ==>
         Without e.stopPropagation(), clicking the copy/remove (child element) button would also trigger the history row’s click, 
         which would put that result back on the display (parent element). */
      navigator.clipboard.writeText(entry.result);
    };
    /* remove button */
    item.querySelector(".hp-remove").onclick = (e) => {
      e.stopPropagation();
      historyData.splice(index, 1); // removes only that particular row/entry
      localStorage.setItem("calcHistory", JSON.stringify(historyData));   //updates the new history pnel
      renderHistory();
    };
    group.appendChild(item);
  });
}
//function for the working of history panel
function addToHistory(expression, result) {
  const entry = {
    expression,
    result,
    date: new Date().toISOString()
  };
  historyData.unshift(entry); // newest on top
  localStorage.setItem("calcHistory", JSON.stringify(historyData));
  renderHistory();
}

/*--FUNCTION TO MANAGE DATES ON HISTORY PANEL--*/
function getDateLabel(isoDate) {
  const entryDate = new Date(isoDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEntry = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
  const diffDays = Math.round(
    (startOfToday - startOfEntry) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return entryDate.toLocaleDateString();
}


/*--FUNCTION FOR KEYBOARD HANDLER--*/
function handleKeyPress(e) {
  const key = e.key;
  if (key >= "0" && key <= "9") {
    appendtoDisplay(key);
    return;
  }
  if (key === ".") {
    appendtoDisplay(".");
    return;
  }
  if (key === "+" || key === "-" || key === "*" || key === "/") {
    appendtoDisplay(key === "*" ? "x" : key);
    return;
  }
  if (key === "Enter" || key === "=") {
    e.preventDefault(); // prevents form submit / page refresh
    calculate();
    return;
  }
  if (key === "Backspace") {
    deleteElement();
    return;
  }
  if (key === "Escape") {
    clearDisplay();
    return;
  }
  if (key === "(" || key === ")") {
    appendtoDisplay(key);
    return;
  }
  // scientific shortcuts
  if (key === "s") applyFunc("sin");
  if (key === "c") applyFunc("cos");
  if (key === "t") applyFunc("tan");
  if (key === "l") applyFunc("log");
  if (key === "^") applyFunc("power");
  if (key === "r") applyFunc("sqrt");
  if (key === "q") applyFunc("square");
}


/*--FUNCTIONS FOR THE CALCULATOR OPERATIONS--*/
function appendtoDisplay(input){
    playClickSound();
    if (display.value === "0") {display.value = input;} 
    else {display.value += input;}
}
function deleteElement(){
    playClickSound();
    if (display.value === "0" || display.value.length === 1){
      display.value = "0";
    }
    else {display.value = display.value.slice(0,-1);}
}
function applyFunc(type){
    playClickSound();
    let value = parseFloat(display.value);
    const exp = display.value;
    let res;
    if (isNaN(value)) return;
    switch(type){
      case "sqrt":
        res = Math.sqrt(value);
        break;
      case "square":
        res = Math.pow(value, 2);
        break;
      case "sin":
        res = Math.sin(value*Math.PI/180);
        break;
      case "cos":
        res = Math.cos(value*Math.PI/180);
        break;
      case "tan":
        res = Math.tan(value*Math.PI/180);
        break;
      case "power":
        if (isNaN(value)) {
          display.value = "0";
          return;
        }
        //store the base and wait for the exponent
        powerBase = value;
        waitingForExponent = true;  //user will enter the exponent
        display.value = "0";
        return;
      case "log":
        res = Math.log10(value);
        break;
      default:
        return;
    }
    display.value=res;
    addToHistory(`${type}(${exp})`, res);
}
function clearDisplay(){
    playClickSound();
    display.value="0";
}
function calculate(){
    playClickSound();
    if (waitingForExponent) {   //checks if in calculating power mode  
      const exponent = parseFloat(display.value);
      if (isNaN(exponent)) return;  //NaN refers to expressions like "abc", which however not applicable here but for error handling
      const result = Math.pow(powerBase, exponent);
      addToHistory(`${powerBase}^${exponent}`, result);
      display.value = result;
      //resumes previous dormant mode
      powerBase = null;
      waitingForExponent = false;
      return;
    }
    //perform usual calculations
    try {
        const expression = display.value;   // will save the expression
        const exp = display.value.replace(/π/g, Math.PI).replace(/x/g, "*").replace(/÷/g, "/");
        const result = eval(exp);        
        display.value = result;              //shows the result
        addToHistory(expression, result);    //add to history
    }
    catch(error){
        display.value = "Error. Try Again";
    }
}



document.addEventListener("keydown", handleKeyPress);
renderHistory();    //so that the saved history appears immediately 
