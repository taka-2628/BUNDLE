document.addEventListener("DOMContentLoaded", () => {
    switchToSignup();
    switchToLogin();
    loginFetch();
    signupFetch();

    handleStockForm();
    handleCryptoForm();

    formShowHide();
});


/* ---------- GLOBAL VARIABLES ---------- */
let currentUser;
let currentUserData;
let stockValueSum = 0;

/* ---------- API KEYS ---------- */
const apiKeyFinnhub = {
    key: "c5s2b1qad3ia8bfb6kag"
}
const apiKeySandboxFinnhub = {
    key: "sandbox_c5s2b1qad3ia8bfb6kb0"
}
const apiKeyAlphaVantage = {
    key: "AGLUFTKW01H9MDTY"
}


/* ---------- SWITCH LOGNIN / SIGNUP ---------- */
function switchToSignup(){
    const signupBtn = document.getElementById("signup-btn");
    signupBtn.addEventListener("click", () => {
        hideLogin();
        showSignup();
        //document.getElementById("no-user-match").remove();
    })
}
function switchToLogin(){
    const loginBtn = document.getElementById("login-btn");
    loginBtn.addEventListener("click", () => {
        hideSignup();
        showLogin();
    })
}

/* ---------- SIGNUP ---------- */
function signupFetch(){
    const signup = document.getElementById("signup-form");
    signup.addEventListener("submit", (e) => {
        e.preventDefault();
        testUsername(e.target);
    })
}
function testUsername(input){
    fetch("https://bundle-heroku-backend-server.herokuapp.com/user")
    .then(res => res.json())
    .then(data => matchUser2(data, input))
}
function matchUser2(data, input){
    const match = data.find(element => element.username == input.username.value);
    if (match == undefined){
        hideSignup();
        showAddBtn();
        showPortfolioValue();
        showMain();
        postFetchUser(input);
    } else {
        usernameTaken();
    }
}
function usernameTaken(){
    const signup = document.getElementById("signup-form");
    let alert = document.createElement("div");
    alert.innerHTML = `
        <p>username already exists</p>
        <p>please try again</p>
    `;

    signup.appendChild(alert);
    signup.reset();
}
function postFetchUser(input){
    const newUser = {
        username: input.username.value,
        name: input.name.value,
        email: input.email.value
    };
    fetch("https://bundle-heroku-backend-server.herokuapp.com/user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(newUser)
    })
    .then(res => res.json())
    .then(user => {
        postFetchUserData(user.id);
        return currentUser = user;
    })
}
function postFetchUserData(userId){
    const newUserdata = {
        user_id: userId,
        stockPositions: [],
        cryptoPositions: []
    };
    fetch("https://bundle-heroku-backend-server.herokuapp.com/userdata", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(newUserdata)
    })
    return currentUserData = newUserdata;
}

/* ---------- LOGIN ---------- */
function loginFetch(){
    const login = document.getElementById("login-form");
    login.addEventListener("submit", (e) => {
        e.preventDefault();
        queryUsername(e.target.username.value);
    })
}
function queryUsername(input){
    fetch("https://bundle-heroku-backend-server.herokuapp.com/user")
    .then(res => res.json())
    .then(data => matchUser(data, input))
}
function matchUser(data, input){
    const match = data.find(element => element.username == input);
    if (match == undefined){
        hideAlert();
        userNotFound();
    } else {
        hideLogin();
        showAddBtn();
        showPortfolioValue();
        showMain();
        fetchExistingPosition(match);
        return currentUser = match;
    }
}
function userNotFound(){
    const login = document.getElementById("login-form");
    let alert = document.createElement("div");
    alert.id = "no-user-match"
    alert.innerHTML = `
        <p>user not found</p>
        <p>please try again</p>
    `;    

    login.appendChild(alert);
    login.reset();
    //document.getElementById("login-form").reset();
}
function hideAlert(){
    const alert = document.getElementById("no-user-match");
    if (alert != null){alert.remove()};
}
function fetchExistingPosition(match){
    fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${match.id}`)
    .then(res => res.json())
    .then(userdata => renderExistingPosition(userdata))
}

async function renderExistingPosition(userdata){
    const stockPositions = userdata.stockPositions;
    const cryptoPositions = userdata.cryptoPositions;
    
    for (stock of stockPositions){
        let priceDataStock = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${apiKeySandboxFinnhub.key}`).then(res => res.json())
        //maybe try .then() instead of await here
        //look into async function 

        renderStock(stock);
        updateStockMarketData(priceDataStock, stock);
    }
    editStockPosition();
    updateStockDashboard();

    for (crypt of cryptoPositions){
        let data = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${crypt.symbol}&to_currency=USD&apikey=${apiKeyAlphaVantage.key}`).then(res => res.json())
        let priceDataCrypto = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
        
        renderCrypto(crypt);
        updateCryptoMarketData(priceDataCrypto, crypt)
    }
    editCryptoPosition();
    updateCryptoDashboard();

    updateMainDashboard();

    return currentUserData = userdata;
}


/* ---------- ADD STOCK ---------- */
function handleStockForm(){
    const stockForm = document.getElementById("stock-form");
    stockForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const stock = e.target;

        postFetchAddStock(stock);
        stockForm.reset();
        stockForm.style.display = "none";
        addStockBtnStyleInactive();
    })    
}
function postFetchAddStock(stock){
    const newStock = {
        ticker: stock.ticker.value,
        numOfShare: parseFloat(stock["num-share"].value),
        costbasis: parseFloat(stock["cost-share"].value)
    }
    currentUserData.stockPositions.push(newStock)
    
    fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(currentUserData)
    })
    .then(res => res.json())
    .then(updatedUserdata => {
        const newlyAddedStock = updatedUserdata.stockPositions[updatedUserdata.stockPositions.length-1];
        renderStock(newlyAddedStock);
        getFetchStockAPI(newlyAddedStock);
        editStockPosition();
    })
}

/* ---------- Finnhub API FETCH ---------- */
function getFetchStockAPI(stock){
    fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${apiKeySandboxFinnhub.key}`)
    .then(res => res.json())
    .then(priceData => {
        updateStockMarketData(priceData, stock);
        updateStockDashboard();
        updateMainDashboard();
    })
}


/* ---------- ADD CRYPTO ---------- */
function handleCryptoForm(){
    const cryptoForm = document.getElementById("crypto-form");
    cryptoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const crypto = e.target;

        postFetchAddCryoto(crypto);
        cryptoForm.reset();
        cryptoForm.style.display = "none";
        addCryptoBtnStyleInactive();
    })    
}
function postFetchAddCryoto(crypto){
    const newCrypto = {
        symbol: crypto.symbol.value,
        numOfToken: parseFloat(crypto["num-token"].value),
        costbasis: parseFloat(crypto["cost-token"].value)
    }
    currentUserData.cryptoPositions.push(newCrypto)
    
    fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(currentUserData)
    })
    .then(res => res.json())
    .then(updatedUserdata => {
        const newlyAddedCrypto = updatedUserdata.cryptoPositions[updatedUserdata.cryptoPositions.length-1];
        renderCrypto(newlyAddedCrypto);
        getFetchCryptoAPI(newlyAddedCrypto);
        editCryptoPosition();
    })
}

/* ---------- AlphaVantage API FETCH ---------- */ 
function getFetchCryptoAPI(crypto){
    fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${crypto.symbol}&to_currency=USD&apikey=${apiKeyAlphaVantage.key}`)
    .then(res => res.json())
    .then(data => {
        const priceData = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
        updateCryptoMarketData(priceData, crypto);
        updateCryptoDashboard();
        updateMainDashboard();
    })
}

/* ---------- EDIT STOCK POSITION ---------- */ 
/*
function addEventListenerToBtn(editBtn){
    editBtn.addEventListener('click', (e) => {
        const stock = e.target.parentNode.parentNode;

        const positionToEdit = document.getElementById("stock-to-edit");
        positionToEdit.textContent = stock.childNodes[0].textContent;
            
        editShowHideStock();
        stockCloseOrEdit(stock);

        handleCloseStock();
        handleEditStock(stock);
    })
};
*/
function editStockPosition(){
    let editBtns = document.getElementsByClassName("edit-btn-stock")
    for (btn of editBtns) {
        btn.addEventListener("click", (e) => {

            // bad practice to loop through HTML element collection and add event listener
            // 1) event delegation: add to the parent elment and then use conditional logic to tell which one 
            // 2) when you render each stock, add event listener there in stead of looping through HTML collection 

            const stock = e.target.parentNode.parentNode;

            const positionToEdit = document.getElementById("stock-to-edit");
            positionToEdit.textContent = stock.childNodes[0].textContent;
            
            editShowHideStock();
            stockCloseOrEdit(stock);

            handleCloseStock();
            handleEditStock(stock);
        })
    }
}

function handleCloseStock(){
    const stockYes = document.getElementById("yes-stock");
    const stockCancel = document.getElementById("cancel-stock");

    stockYes.addEventListener("click", ()=>{
        const stockToDelete = document.getElementById("stock-to-edit").textContent;
        const stockPositions = currentUserData.stockPositions;

        const updatedStockPositions = []
        for (position of stockPositions){
            if (position.ticker != stockToDelete){
                updatedStockPositions.push(position)
            } 
        }

        currentUserData.stockPositions = updatedStockPositions;
        
        fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(currentUserData)
        })

        const stockEditDiv = document.getElementById("stock-edit-form");
        stockEditDiv.style.display = "none";

        deleteRow(stockToDelete);
        updateStockDashboard();
        updateMainDashboard();
    })

    stockCancel.addEventListener("click", () => {
        const stockEditDiv = document.getElementById("stock-edit-form");
        stockEditDiv.style.display = "none";
    })
}
function handleEditStock(){
    const editStockForm = document.getElementById("edit-stock-form");
    const editStockCancel = document.getElementById("cancel-edit-btn");

    editStockForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const addOrSell = document.querySelectorAll('input[name="add-or-sell"]');

        let select;

        for (selection of addOrSell){
            if (selection.checked){
                select = selection.value;
            }
        }

        const stockToEditTicker = document.getElementById("stock-to-edit").textContent;
        const stockToEditRow = document.getElementById(stockToEditTicker);

        const stockPositions = currentUserData.stockPositions;
        let stockToEdit;

        for (position of stockPositions){
            if (position.ticker == stockToEditTicker){
                stockToEdit = position;
            } 
        }

        const currentQuantity = parseFloat(stockToEditRow.childNodes[1].textContent);
        const currentCostTotal = parseFloat(stockToEditRow.childNodes[3].textContent.replace(/[^0-9.-]+/g,""));
        const numOfShareDecOrInc = parseFloat(document.getElementById("how-many-share-to-edit").value);
        const costShareAdded = parseFloat(document.getElementById("cost-share-add").value);

        if (select == "increase"){
            stockToEdit.numOfShare = (currentQuantity + numOfShareDecOrInc);
            stockToEdit.costbasis = Math.round((currentCostTotal + numOfShareDecOrInc * costShareAdded) / (currentQuantity + numOfShareDecOrInc) * 100) / 100;
        } else {
            stockToEdit.numOfShare = (currentQuantity - numOfShareDecOrInc);
        }

        console.log(stockToEdit);
        
        fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(currentUserData)
        })
        
        const stockEditDiv = document.getElementById("stock-edit-form");
        stockEditDiv.style.display = "none";

        deleteRow(stockToEditTicker);
        renderStock(stockToEdit);
        getFetchStockAPI(stockToEdit);
    })
    editStockCancel.addEventListener("click", () => {
        const stockEditDiv = document.getElementById("stock-edit-form");
        stockEditDiv.style.display = "none";
    })
}

/* ---------- EDIT CRYPTO POSITION ---------- */
function editCryptoPosition(){
    let editBtns = document.getElementsByClassName("edit-btn-crypto")
    for (btn of editBtns) {
        btn.addEventListener("click", (e) => {
            const crypto = e.target.parentNode.parentNode;

            const positionToEdit = document.getElementById("crypto-to-edit");
            positionToEdit.textContent = crypto.childNodes[0].textContent;
            
            editShowHideCrypto();
            cryptoCloseOrEdit(crypto);

            handleCloseCrypto();
            handleEditCrypto(crypto);
        })
    }
}
function handleCloseCrypto(){
    const cryptoYes = document.getElementById("yes-crypto");
    const cryptoCancel = document.getElementById("cancel-crypto");

    cryptoYes.addEventListener("click", ()=>{
        const cryptoToDelete = document.getElementById("crypto-to-edit").textContent;
        const cryptoPositions = currentUserData.cryptoPositions;
    
        const updatedCryptoPositions = []
        for (position of cryptoPositions){
            if (position.symbol != cryptoToDelete){
                updatedCryptoPositions.push(position)
            } 
        }

        currentUserData.cryptoPositions = updatedCryptoPositions;
        console.log(currentUserData)
        
        fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(currentUserData)
        })

        const cryptoEditDiv = document.getElementById("crypto-edit-form");
        cryptoEditDiv.style.display = "none";

        deleteRow(cryptoToDelete);
        updateCryptoDashboard();
        updateMainDashboard();
    })
    
    cryptoCancel.addEventListener("click", () => {
        const cryptoEditDiv = document.getElementById("crypto-edit-form");
        cryptoEditDiv.style.display = "none";
    })
}
function handleEditCrypto(crypto){
    const editCryptoForm = document.getElementById("edit-crypto-form");
    const editCryptoCancel = document.getElementById("cancel-edit-btn-crypto");

    editCryptoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const addOrSell = document.querySelectorAll('input[name="add-or-sell-crypto"]');

        let select;

        for (selection of addOrSell){
            if (selection.checked){
                select = selection.value;
            }
        }

        const cryptoToEditTicker = document.getElementById("crypto-to-edit").textContent;
        const cryptoToEditRow = document.getElementById(cryptoToEditTicker);

        const cryptoPositions = currentUserData.cryptoPositions;
        let cryptoToEdit;

        for (position of cryptoPositions){
            if (position.symbol == cryptoToEditTicker){
                cryptoToEdit = position;
            } 
        }

        const currentQuantity = parseFloat(cryptoToEditRow.childNodes[1].textContent);
        const currentCostTotal = parseFloat(cryptoToEditRow.childNodes[3].textContent.replace(/[^0-9.-]+/g,""));
        const numOfTokenDecOrInc = parseFloat(document.getElementById("how-many-token-to-edit").value);
        const costTokenAdded = parseFloat(document.getElementById("cost-token-add").value);

        if (select == "increase"){
            cryptoToEdit.numOfToken = (currentQuantity + numOfTokenDecOrInc);
            cryptoToEdit.costbasis = Math.round((currentCostTotal + numOfTokenDecOrInc * costTokenAdded) / (currentQuantity + numOfTokenDecOrInc) * 100) / 100;
        } else {
            cryptoToEdit.numOfToken = (currentQuantity - numOfTokenDecOrInc);
        }

        console.log(cryptoToEdit);
        
        fetch(`https://bundle-heroku-backend-server.herokuapp.com/userdata/${currentUser.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(currentUserData)
        })
        
        const cryptoEditDiv = document.getElementById("crypto-edit-form");
        cryptoEditDiv.style.display = "none";

        deleteRow(cryptoToEditTicker);
        renderCrypto(cryptoToEdit);
        getFetchCryptoAPI(cryptoToEdit);
    })
    editCryptoCancel.addEventListener("click", () => {
        const cryptoEditDiv = document.getElementById("crypto-edit-form");
        cryptoEditDiv.style.display = "none";
    })
}


/* ---------- RENDER & MANIPULATE DOM ELEMENTS ---------- */
function hideLogin(){
    document.getElementById("login").style.display = "none";
}
function showLogin(){
    document.getElementById("login").style.display = "block";
}

function hideSignup(){
    document.getElementById("signup").style.display = "none";
}
function showSignup(){
    document.getElementById("signup").style.display = "block";
}

function showAddBtn(){
    document.getElementById("add-stock-btn").style.display = "inline-block";
    document.getElementById("add-crypto-btn").style.display = "inline-block"
}

function formShowHide(){
    const addStockBtn = document.getElementById("add-stock-btn");
    const stockForm = document.getElementById("stock-form");
    const addCryptoBtn = document.getElementById("add-crypto-btn")
    const cryptoForm = document.getElementById("crypto-form");
    let stockFormShown = false;
    let cryptoFormShown = false;
    addStockBtn.addEventListener("click", () => {
        if (stockFormShown == false){
            addStockBtnStyleActive();
            addCryptoBtnStyleInactive();
            cryptoForm.style.display = "none"
            stockForm.style.display = "block"
            stockFormShown = true;
            cryptoFormShown = false;
        } else {
            addStockBtnStyleInactive();
            stockForm.style.display = "none";
            return stockFormShown = false;
        }
    })
    addCryptoBtn.addEventListener("click", () => {
        if (cryptoFormShown == false){
            addCryptoBtnStyleActive()
            addStockBtnStyleInactive();
            stockForm.style.display = "none"
            cryptoForm.style.display = "block"
            cryptoFormShown = true;
            stockFormShown = false;
        } else {
            addCryptoBtnStyleInactive();
            cryptoForm.style.display = "none";
            return cryptoFormShown = false;
        }
    })
}
function addStockBtnStyleActive(){
    const addStockBtn = document.getElementById("add-stock-btn");
    addStockBtn.style.backgroundColor = "#3d3d3d";
    addStockBtn.style.border = "solid #ffffff";
    addStockBtn.style.borderWidth = "2px";
    addStockBtn.style.padding = "4px 13px";
    addStockBtn.style.color = "#ffffff";
}
function addStockBtnStyleInactive(){
    const addStockBtn = document.getElementById("add-stock-btn");
    addStockBtn.style.backgroundColor = "#eaeaea";
    addStockBtn.style.border = "none";
    addStockBtn.style.padding = "6px 15px";
    addStockBtn.style.color = "#000000";
}
function addCryptoBtnStyleActive(){
    const addCryptoBtn = document.getElementById("add-crypto-btn");
    addCryptoBtn.style.backgroundColor = "#3d3d3d";
    addCryptoBtn.style.border = "solid #ffffff";
    addCryptoBtn.style.borderWidth = "2px";
    addCryptoBtn.style.padding = "4px 13px";
    addCryptoBtn.style.color = "#ffffff";
}
function addCryptoBtnStyleInactive(){
    const addCryptoBtn = document.getElementById("add-crypto-btn");
    addCryptoBtn.style.backgroundColor = "#eaeaea";
    addCryptoBtn.style.border = "none";
    addCryptoBtn.style.padding = "6px 15px";
    addCryptoBtn.style.color = "#000000";
}

function showPortfolioValue(){
    document.getElementById("container").style.display = "block";
}

function showMain(){
    document.querySelector("main").style.display = "block"
}

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
function renderStock(stock){
    const stockPositions = document.getElementById("stock-positions")
    const tr = document.createElement("tr");
    tr.id = stock.ticker;

    const ticker = document.createElement("td");
    const numShare = document.createElement("td");
    const cost = document.createElement("td");
    const costTotal = document.createElement("td")
    const price = document.createElement("td")
    const marketValue = document.createElement("td");
    const uPL = document.createElement("td");
    const editBtnContainer = document.createElement("td");
    const editBtn = document.createElement("button");

    ticker.textContent = stock.ticker;
    numShare.textContent = stock.numOfShare;
    cost.textContent = formatter.format(stock.costbasis);
    costTotal.textContent = formatter.format(stock.costbasis * stock.numOfShare)
    
    editBtn.className = "edit-btn-stock";
    editBtnContainer.className = "edit-btn-stock-container";
    editBtnContainer.appendChild(editBtn);
    

    tr.appendChild(ticker);
    tr.appendChild(numShare);
    tr.appendChild(cost);
    tr.appendChild(costTotal);
    tr.appendChild(price);
    tr.appendChild(marketValue);
    tr.appendChild(uPL);
    tr.appendChild(editBtnContainer);

    stockPositions.appendChild(tr);

    //addEventListenerToBtn(editBtn);
}

function updateStockMarketData(priceData, stock){
    const tr = document.getElementById(stock.ticker);
    const currentPrice = tr.childNodes[4];
    const marketValue = tr.childNodes[5];
    const unrealizedPL = tr.childNodes[6];

    let price = priceData.c;
    let value = stock.numOfShare * priceData.c
    let uPL = (stock.numOfShare * priceData.c)-(stock.numOfShare * stock.costbasis)

    currentPrice.textContent = formatter.format(price)
    marketValue.textContent = formatter.format(value)
    unrealizedPL.textContent = formatter.format(uPL)
}

function updateStockDashboard(){
    const stockTable = document.getElementById("stock-positions");

    let sumCost = 0;
    for (let i = 1; i < stockTable.rows.length; i++){
        const usdCost = stockTable.rows[i].cells[3].textContent;
        const numCost = Number(usdCost.replace(/[^0-9.-]+/g,""));
        sumCost = sumCost + numCost;
    }
    const stockCostBasis = document.getElementById("stock-cost-basis");
    stockCostBasis.textContent = formatter.format(sumCost);

    let sumMarketValue = 0;
    for (let i = 1; i < stockTable.rows.length; i++){
        const usdMarketValue = stockTable.rows[i].cells[5].textContent;
        const numMarketValue = Number(usdMarketValue.replace(/[^0-9.-]+/g,""));
        sumMarketValue = sumMarketValue + numMarketValue;
    }
    const stockMarketValue = document.getElementById("stock-portfolio");
    stockMarketValue.textContent = formatter.format(sumMarketValue);
    
    let sumPL = 0;
    for (let i=1; i < stockTable.rows.length; i++){
        const usdPL = stockTable.rows[i].cells[6].textContent;
        const numPL = Number(usdPL.replace(/[^0-9.-]+/g,""));
        sumPL = sumPL + numPL;
    }
    const stockPL = document.getElementById("stock-profit-loss");
    stockPL.textContent = formatter.format(sumPL);
}

function renderCrypto(crypto){
    const cryptoPositions = document.getElementById("crypto-positions")
    const tr = document.createElement("tr");
    tr.id = crypto.symbol;

    const symbol = document.createElement("td");
    const numToken = document.createElement("td");
    const cost = document.createElement("td");
    const costTotal = document.createElement("td")
    const price = document.createElement("td")
    const marketValue = document.createElement("td");
    const uPL = document.createElement("td");
    const editBtnContainer = document.createElement("td");
    const editBtn = document.createElement("button");

    symbol.textContent = crypto.symbol;
    numToken.textContent = crypto.numOfToken;
    cost.textContent = formatter.format(crypto.costbasis);
    costTotal.textContent = formatter.format(crypto.costbasis * crypto.numOfToken);

    editBtn.className = "edit-btn-crypto";
    editBtnContainer.className = "edit-btn-crypto-container";
    editBtnContainer.appendChild(editBtn);
    
    tr.appendChild(symbol);
    tr.appendChild(numToken);
    tr.appendChild(cost);
    tr.appendChild(costTotal)
    tr.appendChild(price);
    tr.appendChild(marketValue);
    tr.appendChild(uPL);
    tr.appendChild(editBtnContainer);

    cryptoPositions.appendChild(tr);
}

function updateCryptoMarketData(priceData, crypto){
    const tr = document.getElementById(crypto.symbol);
    const currentPrice = tr.childNodes[4];
    const marketValue = tr.childNodes[5];
    const unrealizedPL = tr.childNodes[6];

    currentPrice.textContent = formatter.format(priceData)
    marketValue.textContent = formatter.format(crypto.numOfToken * priceData)
    unrealizedPL.textContent = formatter.format((crypto.numOfToken * priceData)-(crypto.numOfToken * crypto.costbasis))
}

function updateCryptoDashboard(){
    const cryptoTable = document.getElementById("crypto-positions");

    let sumCost = 0;
    for (let i = 1; i < cryptoTable.rows.length; i++){
        const usdCost = cryptoTable.rows[i].cells[3].textContent;
        const numCost = Number(usdCost.replace(/[^0-9.-]+/g,""));
        sumCost = sumCost + numCost;
    }
    const cryptoCostBasis = document.getElementById("crypto-cost-basis");
    cryptoCostBasis.textContent = formatter.format(sumCost);

    let sumMarketValue = 0;
    for (let i = 1; i < cryptoTable.rows.length; i++){
        const usdMarketValue = cryptoTable.rows[i].cells[5].textContent;
        const numMarketValue = Number(usdMarketValue.replace(/[^0-9.-]+/g,""));
        sumMarketValue = sumMarketValue + numMarketValue;
    }
    const cryptoMarketValue = document.getElementById("crypto-portfolio");
    cryptoMarketValue.textContent = formatter.format(sumMarketValue);

    let sumPL = 0;
    for (let i = 1; i < cryptoTable.rows.length; i++){
        const usdPL = cryptoTable.rows[i].cells[6].textContent;
        const numPL = Number(usdPL.replace(/[^0-9.-]+/g,""));
        sumPL = sumPL + numPL;
    }
    const cryptoPL = document.getElementById("crypto-profit-loss");
    cryptoPL.textContent = formatter.format(sumPL);
}

function updateMainDashboard(){
    const stockCostBasis = Number(document.getElementById("stock-cost-basis").textContent.replace(/[^0-9.-]+/g,""));
    const cryptoCostBasis = Number(document.getElementById("crypto-cost-basis").textContent.replace(/[^0-9.-]+/g,""));
    const mainCostBasis = document.getElementById("cost-basis");
    mainCostBasis.textContent = formatter.format(stockCostBasis + cryptoCostBasis);

    const stockMarketValue = Number(document.getElementById("stock-portfolio").textContent.replace(/[^0-9.-]+/g,""));
    const cryptoMarketValue = Number(document.getElementById("crypto-portfolio").textContent.replace(/[^0-9.-]+/g,""));
    const mainMarketValue = document.getElementById("portfolio");
    mainMarketValue.textContent = formatter.format(stockMarketValue + cryptoMarketValue);

    const stockPL = Number(document.getElementById("stock-profit-loss").textContent.replace(/[^0-9.-]+/g,""));
    const cryptoPL = Number(document.getElementById("crypto-profit-loss").textContent.replace(/[^0-9.-]+/g,""));
    const mainPL = document.getElementById("profit-loss");
    mainPL.textContent = formatter.format(stockPL + cryptoPL);
}

function editShowHideStock(){
    const stockEditDiv = document.getElementById("stock-edit-form");
    stockEditDiv.style.display = "block";
}

function stockCloseOrEdit(stock){
    const closePositionBtn = document.getElementById("close-btn-stock")
    const editPositionBtn = document.getElementById("edit-btn-stock")
    
    const closePositionContainer = document.getElementById("delete-position-cont-stock");
    const editPositionContainer = document.getElementById("edit-position-cont-stock");

    const numOfShareYouOwn = document.getElementById("how-many-share-you-own");

    numOfShareYouOwn.textContent = `You own ${stock.childNodes[1].textContent} shares`;

    let closePositionShown = false;
    let editPositionShown = false;

    closePositionBtn.addEventListener("click", () => {
        if (closePositionShown == false){
            closeStockBtnActive();
            editStockBtnInActive();
            editPositionContainer.style.display = "none";
            closePositionContainer.style.display = "block";
            editPositionShown = false;
            closePositionShown = true;
        } else {
            closeStockBtnInActive();
            closePositionContainer.style.display = "none";
            closePositionShown = false;
        }
    })

    editPositionBtn.addEventListener("click", () => {
        if (editPositionShown == false){
            editStockBtnActive();
            closeStockBtnInActive();
            closePositionContainer.style.display = "none";
            editPositionContainer.style.display = "block";
            closePositionShown = false;
            editPositionShown = true;
        } else {
            editStockBtnInActive()
            editPositionContainer.style.display = "none";
            editPositionShown = false;
        }
    })

    showHidePricePerShare();
}
function closeStockBtnActive(){
    const closePositionBtn = document.getElementById("close-btn-stock");
    closePositionBtn.style.padding = "4px 17px";
    closePositionBtn.style.backgroundColor = "#eaeaea";
    closePositionBtn.style.border = "solid #000000";
    closePositionBtn.style.borderWidth = "3px";
    closePositionBtn.style.color = "#000000";
}
function closeStockBtnInActive(){
    const closePositionBtn = document.getElementById("close-btn-stock");
    closePositionBtn.style.padding = "7px 20px";
    closePositionBtn.style.backgroundColor = "#727272";
    closePositionBtn.style.border = "none";
    closePositionBtn.style.color = "#ffffff";
}
function editStockBtnActive(){
    const editPositionBtn = document.getElementById("edit-btn-stock");
    editPositionBtn.style.padding = "4px 17px";
    editPositionBtn.style.backgroundColor = "#eaeaea";
    editPositionBtn.style.border = "solid #000000";
    editPositionBtn.style.borderWidth = "3px";
    editPositionBtn.style.color = "#000000";
}
function editStockBtnInActive(){
    const editPositionBtn = document.getElementById("edit-btn-stock");
    editPositionBtn.style.padding = "7px 20px";
    editPositionBtn.style.backgroundColor = "#727272";
    editPositionBtn.style.border = "none";
    editPositionBtn.style.color = "#ffffff";
}

function showHidePricePerShare(){
    const addStockSelection = document.getElementById("add-stock-selection");
    const sellStockSelection = document.getElementById("sell-stock-selection");
            
    const costPerShareAdd = document.getElementById("cost-share-add");

    addStockSelection.addEventListener("click", () => {
        costPerShareAdd.style.display = "block";
    })
    sellStockSelection.addEventListener("click", () => {
        costPerShareAdd.style.display = "none";
    })
}

function deleteRow(assetToDelete){
    const rowToDelete = document.getElementById(assetToDelete)
    rowToDelete.remove();
}


function editShowHideCrypto(){
    const cryptoEditDiv = document.getElementById("crypto-edit-form");
    cryptoEditDiv.style.display = "block";
}

function cryptoCloseOrEdit(crypto){
    const closePositionBtn = document.getElementById("close-btn-crypto");
    const editPositionBtn = document.getElementById("edit-btn-crypto");
    
    const closePositionContainer = document.getElementById("delete-position-cont-crypto");
    const editPositionContainer = document.getElementById("edit-position-cont-crypto");

    const numOfTokenYouOwn = document.getElementById("how-many-token-you-own");

    numOfTokenYouOwn.textContent = `you own ${crypto.childNodes[1].textContent} tokens`;

    let closePositionShown = false;
    let editPositionShown = false;

    closePositionBtn.addEventListener("click", () => {
        if (closePositionShown == false){
            editPositionContainer.style.display = "none";
            closePositionContainer.style.display = "block";
            editPositionShown = false;
            closePositionShown = true;
        } else {
            closePositionContainer.style.display = "none";
            closePositionShown = false;
        }
    })

    editPositionBtn.addEventListener("click", () => {
        if (editPositionShown == false){
            closePositionContainer.style.display = "none";
            editPositionContainer.style.display = "block";
            closePositionShown = false;
            editPositionShown = true;
        } else {
            editPositionContainer.style.display = "none";
            editPositionShown = false;
        }
    })

    showHidePricePerToken();
}

function showHidePricePerToken(){
    const addCryptoSelection = document.getElementById("add-crypto-selection");
    const sellCryptoSelection = document.getElementById("sell-crypto-selection");
            
    const costPerTokenAdd = document.getElementById("cost-token-add");

    addCryptoSelection.addEventListener("click", () => {
        costPerTokenAdd.style.display = "block";
    })
    sellCryptoSelection.addEventListener("click", () => {
        costPerTokenAdd.style.display = "none";
    })
}