const mapData = {
    minX: 1,
    maxX: 14,
    minY: 4,
    maxY: 12,
    blockedSpaces: {
        "7x4": true,
        "1x11": true,
        "12x10": true,
        "4x7": true,
        "5x7": true,
        "6x7": true,
        "8x6": true,
        "9x6": true,
        "10x6": true,
        "7x9": true,
        "8x9": true,
        "9x9": true,
    },
    specialSpaces: {
        "3x4": "Coffe Shop",
        "11x4": "Pizza Shop"
    }
}


// Player colors in sprite order
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"]


//Misc Helpers
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)]
}
function getKeyString(x, y){
    return `${x}x${y}`
}

function getRandomSafeSpot() {
    //We don't look things up by key here, so just return an x/y
    return randomFromArray([
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 2, y: 9 },
      { x: 4, y: 8 },
      { x: 5, y: 5 },
      { x: 5, y: 8 },
      { x: 5, y: 10 },
      { x: 5, y: 11 },
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
      { x: 13, y: 6 },
      { x: 13, y: 8 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 10, y: 8 },
      { x: 8, y: 8 },
      { x: 11, y: 4 },
    ]);
  }


function createName() {
    const prefix = randomFromArray([
        "COOL",
        "SUPER",
        "HIP",
        "SMUG",
        "COOL",
        "SILKY",
        "GOOD",
        "SAFE",
        "DEAR",
        "DAMP",
        "WARM",
        "RICH",
        "LONG",
        "DARK",
        "SOFT",
        "BUFF",
        "DOPE"
    ])
    const animal = randomFromArray([
        "BEAR",
        "DOG",
        "CAT",
        "FOX",
        "LAMB",
        "LION",
        "BOAR",
        "VOLE",
        "SEAL",
        "PUMA",
        "MULE",
        "BULL",
        "BIRD",
        "BUG"
    ])
    return `${prefix} ${animal}`
}

function isSolid(x,y){
    const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)]
    return (
        blockedNextSpace || x >= mapData.maxX || x < mapData.minX || y >= mapData.maxY || y < mapData.minY
    )
}

(function () {
    // inital vars
    let playerId
    let playerRef
    let players = {}
    let playersArr = []
    let playerElements = {}
    let coins = {}
    let coinElements = {}
    let bossElement

    const gameContainer = document.querySelector(".game-container")
    const playerNameInput = document.querySelector("#player-name")
    const playerColorButton = document.querySelector("#player-color")
    const modal = document.querySelector(".modal")
    const overlay = document.querySelector("#overlay")
    const closeModalBtn = document.querySelector(".close-button")
    var modal_buy

    chat = document.querySelector(".chat")
    chatInput = document.querySelector("#chat-input")

    // closes shop modal
    function closeModal(){
        modal.classList.remove("active")
        overlay.classList.remove("active")
    }

    //opens shop modal
    function openModal(){
        modal.classList.add("active")
        overlay.classList.add("active")
        chatInput.disabled = true
        ADwn.unbind()
        AUp.unbind()
        ALft.unbind()
        ARight.unbind()
    }

    // close modal by button
    closeModalBtn.addEventListener("click", () => {

        closeModal()
        closeModalBtn.blur()
        ADwn.bind()
        AUp.bind()
        ALft.bind()
        ARight.bind()
        chatInput.disabled = false
    })  


    // places coins around the map
    function placeCoin() {
        const {x, y} = getRandomSafeSpot()
        const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`)
        coinRef.set({
            x,
            y,
        })

        const coinTimeouts = [2000, 3000, 4000, 5000]
        setTimeout(() => {
            placeCoin()
        }, randomFromArray(coinTimeouts))
    }

    function attemptGrabCoin(x, y) {
        const key = getKeyString(x, y);
        if (coins[key]) {
          // Remove this key from data, then uptick Player's coin count
          firebase.database().ref(`coins/${key}`).remove();
          playerRef.update({
            coins: players[playerId].coins + 1,
          })
        }
    }

    function handleArrowPress(xchange=0, yChange=0){
        const newX = players[playerId].x + xchange
        const newY = players[playerId].y + yChange
        if(!isSolid(newX, newY)){
            // Move to next space
            players[playerId].x = newX
            players[playerId].y = newY
            if(xchange > 0){
                players[playerId].direction = "right"
            }
            if(xchange < 0){
                players[playerId].direction = "left"
            }
            playerRef.set(players[playerId])
            attemptGrabCoin(newX, newY)
        }
    }

    function atShop(){
        let currentShop = mapData.specialSpaces[getKeyString(players[playerId].x, players[playerId].y)]
        const modal = document.querySelector(".modal")

        if(currentShop != undefined){
            modal.querySelector(".modal-head").innerText = currentShop
            let property = ""
            let shopText = ""
            if(currentShop == "Pizza Shop"){
                shopText = "Pay 10 coins to refil health"
                property = "health"
            }else {
                shopText = "Pay 10 coins to refil mana"
                property = "mana"
            }
            modal.querySelector(".modal-bod").innerHTML = `
            <p>${shopText}</p>
            <button class="modal-buy">click here</button>
            `
            modal_buy = modal.querySelector(".modal-buy")
            

            openModal()
            modal_buy.addEventListener("click", () => {
                if(players[playerId].coins >= 10 && players[playerId][property] != 100){
                    playerRef .update({
                        coins: players[playerId].coins - 10,
                    })
                    if(property == "mana"){
                        playerRef.update({
                            mana: 100
                        })
                    }else{
                        playerRef.update({
                            health: 100
                        })
                    }
                    closeModal()
                    closeModalBtn.blur()
                    ADwn.bind()
                    AUp.bind()
                    ALft.bind()
                    ARight.bind()
                    chatInput.disabled = false
                }
            })  
        }
    }

    function initGame() {

        AUp = new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
        ADwn = new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
        ALft = new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
        ARight = new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))
        SpaceBar = new KeyPressListener("Space", () => atShop())

        const allPlayersRef = firebase.database().ref(`players`)
        const allCoinsRef = firebase.database().ref(`coins`)
    
        allPlayersRef.on("value", (snapshot) => {
            //Fires when a change occures
            players = snapshot.val() || {}
            Object.keys(players).forEach((key) => {
                const characterState = players[key]
                let el = playerElements[key]
                // update DOM
                el.querySelector(".Character_name").innerText = characterState.name
                el.querySelector(".Character_coins").innerText = characterState.coins
                el.setAttribute("data-color", characterState.color)
                el.setAttribute("data-direction", characterState.direction)
                const left = 16 * characterState.x + "px"
                const top = 16 * characterState.y - 4 + "px"
                el.style.transform = `translate3d(${left}, ${top}, 0)`
                Bars = el.querySelectorAll("#myBar")
                Bars[0].style.width = `${characterState.health}%`
                Bars[1].style.width = `${characterState.mana}%`
                Bars[1].style.backgroundColor = `blue`
            })
    
        })

        firebase.database().ref("boss/").on("child_added", (snapshot) => {
            const addedBoss = snapshot.val()
            bossElement = document.createElement("div")  
            bossElement.classList.add("Character", "grid-cell")

            bossElement.innerHTML = (`
              <div class="Character_shadow grid-cell"></div>
              <div class="Character_sprite grid-cell"></div>
              <div class="Character_name-container">
                  <span class="Character_name"></span>
                  <span class="Character_coins">0</span>
                  <div id="myProgress">
                      <div id="myBar"></div>
                  </div>
                  <div id="myProgress">
                      <div id="myBar"></div>
                  </div>
              </div>
              <div class="Character_you-arrow"></div>
            `)
            playerElements[addedBoss.id] = bossElement
            console.log(addedBoss)
            //fill some initial state
            bossElement.querySelector(".Character_name").innerText = addedBoss.name
            bossElement.querySelector(".Character_coins").innerText = addedBoss.coins
            bossElement.setAttribute("data-color", addedBoss.color)
            bossElement.setAttribute("data-direction", addedBoss.direction)
            const left = 16 * addedBoss.x + "px"
            const top = 16 * addedBoss.y - 5 + "px"
            bossElement.style.transform = `translate3d(${left}, ${top}, 0)`
            Bars = bossElement.querySelectorAll("#myBar")
            Bars[0].style.width = `${addedBoss.health}%`
            Bars[1].style.width = `${addedBoss.mana}%`
            Bars[1].style.backgroundColor = `blue`
            gameContainer.appendChild(bossElement)
        })

        // update boss when they move
        firebase.database().ref("boss/slimeking").on("value", (snapshot) => {
                //Fires when a change occures
                const boss = snapshot.val()
                let el = bossElement
                if(el){
                // update DOM
                el.querySelector(".Character_name").innerText = boss.name
                el.querySelector(".Character_coins").innerText = boss.coins
                el.setAttribute("data-color", boss.color)
                el.setAttribute("data-direction", boss.direction)
                const left = 16 * boss.x + "px"
                const top = 16 * boss.y - 5 + "px"
                el.style.transform = `translate3d(${left}, ${top}, 0)`
                Bars = el.querySelectorAll("#myBar")
                Bars[0].style.width = `${boss.health}%`
                Bars[1].style.width = `${boss.mana}%`
                Bars[1].style.backgroundColor = `blue`
            }
        })

        
        allPlayersRef.on("child_added", (snapshot) => {
          //Fires whenever new node/player is added
          const addedPlayer = snapshot.val()
          const characterElement = document.createElement("div")  
          characterElement.classList.add("Character", "grid-cell")
          if(addedPlayer.id === playerId){
            characterElement.classList.add("you")
          }
          characterElement.innerHTML = (`
            <div class="Character_shadow grid-cell"></div>
            <div class="Character_sprite grid-cell"></div>
            <div class="Character_name-container">
                <span class="Character_name"></span>
                <span class="Character_coins">0</span>
                <div id="myProgress">
                    <div id="myBar"></div>
                </div>
                <div id="myProgress">
                    <div id="myBar"></div>
                </div>
            </div>
            <div class="Character_you-arrow"></div>
          `)
          playerElements[addedPlayer.id] = characterElement
          playersArr.push(addedPlayer.id)
    
          //fill some initial state
          characterElement.querySelector(".Character_name").innerText = addedPlayer.name
          characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins
          characterElement.setAttribute("data-color", addedPlayer.color)
          characterElement.setAttribute("data-direction", addedPlayer.direction)
          const left = 16 * addedPlayer.x + "px"
          const top = 16 * addedPlayer.y - 4 + "px"
          characterElement.style.transform = `translate3d(${left}, ${top}, 0)`
          Bars = characterElement.querySelectorAll("#myBar")
          Bars[0].style.width = `${addedPlayer.health}%`
          Bars[1].style.width = `${addedPlayer.mana}%`
          Bars[1].style.backgroundColor = `blue`
          gameContainer.appendChild(characterElement)
    
        })

        // remvoe player on leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removeKey = snapshot.val().id
            gameContainer.removeChild(playerElements[removeKey])
            playersArr.splice(playersArr.indexOf(removeKey), 1)
            delete playerElements[removeKey]
        })

        allCoinsRef.on("value", (snapshot) => {
            coins = snapshot.val() || {};
          });
          
        allCoinsRef.on("child_added", (snapshot) => {
            const coin = snapshot.val()
            const key = getKeyString(coin.x, coin.y)
            coins[key] = true

            //Create the DOM Element
            const coinElement = document.createElement("div")
            coinElement.classList.add("Coin", "grid-cell")
            coinElement.innerHTML = `
            <div class="Coin_shadow grid-cell"></div>
            <div class="Coin_sprite grid-cell"></div>
            `

            // Position the Element
            const left = 16 * coin.x + "px"
            const top = 16 * coin.y - 4 + "px"
            coinElement.style.transform = `translate3d(${left}, ${top}, 0)`

            //Keep a refence to later on remove the coin
            coinElements[key] = coinElement
            gameContainer.appendChild(coinElement)
        })
        allCoinsRef.on("child_removed", (snapshot) => {
            const {x,y} = snapshot.val();
            const keyToRemove = getKeyString(x,y);
            gameContainer.removeChild( coinElements[keyToRemove] );
            delete coinElements[keyToRemove];
          })

        // player name changed
        playerNameInput.addEventListener("change", (e) => {
            const newName = e.target.value || createName()
            playerNameInput.value = newName
            playerRef.update({
                name: newName
            })
        })
        function loadMessages(){

            // load the last 12 messages and listen for more
            var query = firebase.firestore()
                .collection('messages')
                .orderBy('timestamp')
                .limit(100);
            // listen for new messages
            query.onSnapshot(function(snapshot){
                snapshot.docChanges().forEach(function(change){
                    if(change.type == "removed"){
                        console.log("delete")
                    }if(change.type == "added"){
                        var message = change.doc.data()
                        chat.innerHTML += `<p><b>${message.name}</b>: ${message.text}</p>`
                        chat.scrollTop = chat.scrollHeight;
                    }
 
                })
            })
        }

        //save chat message
        function saveMessage(messageText) {
            console.log("svae")
            // Add a new message entry to the database.
            return firebase.firestore().collection('messages').add({
            name: players[playerId].name,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(error) {
            console.error('Error writing new message to database', error);
            });
        }
        
        // new chat message
        chatInput.addEventListener("change", (e) => {
            if(chatInput.value != ""){
                saveMessage(e.target.value)
                chatInput.value = ""
            }
        })



        //update player color
        playerColorButton.addEventListener("click", () => {
            const mySkinIndex = playerColors.indexOf(players[playerId].color)
            const nextColor = playerColors[mySkinIndex + 1] || playerColors[0]
            playerRef.update({
                color: nextColor
            })
        })
        function makeBoss(){
            //log boss to database
            bossRef = firebase.database().ref(`boss/slimeking`)
            const {x, y} = getRandomSafeSpot()
            bossRef.set({
                name: "Slime King",
                direction: "right",
                x,
                y,
                color: "dark",
                coins: 0,
                mana: 100,
                health: 100,
            })
        }

        function moveBoss(){
            const randId = randomFromArray(playersArr)
            if(players[randId]){
                const player = players[randId]
                const x = player.x
                const y = player.y
                bossRef.update({
                    x,
                    y
                })
            }
            setTimeout(() => {
                moveBoss()
            }, 5000)
        }

        function collideBoss(){
            const bound = playerElements[playerId].querySelector(".Character_sprite").getBoundingClientRect()

            const bossBound = bossElement.querySelector(".Character_sprite").getBoundingClientRect()
            const  overlap = !(bound.right - 3 < bossBound.left || 
                bound.left + 3 > bossBound.right || 
                bound.bottom < bossBound.top + 3|| 
                bound.top  > bossBound.bottom)
            if(overlap && players[playerId].collide){
                const el = playerElements[playerId].querySelector(".Character_sprite")
                el.style.animation = "blink 0.2s linear 10"
                playerRef.update({
                    health: players[playerId].health - 15,
                    collide: false
                })
            }
            setTimeout(() => {
                collideBoss()
            }, 5)
        }

        // when player is damaged
        playerElements[playerId].querySelector(".Character_sprite").addEventListener("animationend", () => {
            playerElements[playerId].querySelector(".Character_sprite").style.animation = "none"
            playerRef.update({
                collide: true
            })
        })

        //place first coin
        placeCoin()
        makeBoss()
        loadMessages()
        moveBoss()
        collideBoss()
    }


    firebase.auth().onAuthStateChanged((user) => {
        console.log(user)
        if(user){
            // Logged In!
            playerId = user.uid
            playerRef = firebase.database().ref(`players/${playerId}`)

            const name = createName()
            playerNameInput.value = name
            const {x, y} = getRandomSafeSpot()

            playerRef.set({
                id: playerId,
                name,
                direction: "right",
                color: randomFromArray(playerColors),
                x,
                y,
                coins: 0,
                mana: 0,
                health: 100,
                collide: true
            })
            
            playerRef.onDisconnect().remove()
            playerRef.onDisconnect()

            initGame()
        }else{
        }
    })


    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code
        var errorMessage = error.message

        console.log(errorCode, errorMessage)
    })



}())
