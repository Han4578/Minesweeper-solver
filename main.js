let container = document.querySelector(".container")
let overlay = document.querySelector(".overlay")
let size = 10
let bombs = 50
let width = 300
let tiles = new Map()
let starting = []
let layoutChanged = false

document.querySelector(":root").style.setProperty("--size", size)
document.querySelector(":root").style.setProperty("--width", width + "px")
document.addEventListener("keydown", e => {
    if (e.key == "r") reset()
})

generateGrids()
generateBombs()

function generateGrids() {
    tiles = new Map()
    container.innerHTML = ""
    overlay.innerHTML = ""
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const tile = document.createElement("div")
            const over = document.createElement("div")
            tile.classList.add("tile")
            over.classList.add("otile")
            tile.addEventListener("auxclick", clear)
            over.addEventListener("click", reveal)
            over.addEventListener("contextmenu", flag)
            let map = new Map([["value", 0], ["revealed", false], ["surrounding", []], ["tile", tile], ["over", over], ["flagged", false]])
            tiles.set(`${j},${i}`, map)
            tile.map = map
            over.map = map
            container.appendChild(tile)
            overlay.appendChild(over)
        }
    }
    
    for (let [coords, tile] of tiles.entries()) {
        coords = coords.split(",")
        let x = parseInt(coords[0])
        let y = parseInt(coords[1])
        let adjacent = [
            {
                x: x + 1,
                y: y
            },
            {
                x: x + 1,
                y: y + 1
            },
            {
                x: x,
                y: y + 1
            },
            {
                x: x - 1,
                y: y + 1
            },
            {
                x: x - 1,
                y: y
            },
            {
                x: x - 1,
                y: y - 1
            },
            {
                x: x,
                y: y - 1
            },
            {
                x: x + 1,
                y: y - 1
            }
        ]
        for (const c of adjacent) {
            if (c.x < 0 || c.y < 0 || c.x > size - 1 || c.y > size - 1) continue
            let t = tiles.get(`${c.x},${c.y}`)
            tile.get("surrounding").push(t)
        }
    }
}

function generateBombs() {
    let i = 0
    let b = bombs
    for (let tile of tiles.values()) {
        if (starting.includes(tile)) continue
        const chance = Math.random() < b / (Math.pow(size, 2) - i++);
        if (chance) {
            b--
            tile.set("value", "b")
            tile.get("tile").classList.add("bomb")
        }
    }
    for (let map of tiles.values()) {
        if (map.get("value") != "b") continue
        for (const m of map.get("surrounding")) {
            if (m.get("value") != "b") m.set("value", m.get("value") + 1)
        }
    }
    for (const tile of tiles.values()) {
        if (tile.get("value") != "b" && tile.get("value") != "0") tile.get("tile").innerText = tile.get("value")
    }
}

function reveal(e, m = null) {
    let map = (m == null)? e.target.map : m
    let over = map.get("over");
    let tile = map.get("tile");

    if (map.get("revealed") || map.get("flagged")) return
    over.classList.add("reveal")
    map.set("revealed", true)
    over.removeEventListener("click", reveal)

    if (starting.length == 0) {
        for (const m of tiles.values()) {
            if (!m.get("flagged")) continue
            let over = m.get("over")
            over.classList.remove("flag")
            m.set("flagged", false)
            
        }
        starting = map.get("surrounding").concat(map)
        if (map.get("value") == "b") removeBomb(map)
        for (const c of map.get("surrounding")) {
            if ((c.get("value") == "b" && removeBomb(c)) || c.get("value") != "b") reveal("", c)
        }
    }
    if (map.get("value") == 0) {
        for (const c of map.get("surrounding")) {
            reveal("", c)
        }
    } else if (map.get("value") == "b" && !starting.includes(map)) {
        gameEnd()
        tile.style.backgroundColor = "red"
    }
    if (m == null && [...tiles.values()].every(m => {return m.get("revealed") || m.get("value") == "b"})) {
        for (const map of tiles.values()) {
            let over = map.get("over")
            over.removeEventListener("click", reveal)
            over.classList.add("end")
        }
        document.body.style.backgroundColor = "lightgreen"
    }
}

function gameEnd() {
    for (const map of tiles.values()) {
        let over = map.get("over")
        over.removeEventListener("click", reveal)
        over.classList.add("end")
        if (map.get("value") == "b") {
            over.classList.add("bomb")
            over.innerText = ""
        }
    }
}

function removeBomb(map) {
    let numTiles = [...tiles.values()].filter(m => {return m.get("value") != "b" && !starting.includes(m) && !m.get("revealed")})
    let random = Math.floor(Math.random() * numTiles.length)
    if (numTiles.length == 0) return false
    let newTile = numTiles[random]
    newTile.set("value", "b")
    newTile.get("tile").classList.add("bomb") 
    newTile.get("tile").innerText = ""
    map.set("value", 0)

    for (const t of newTile.get("surrounding").filter(m => {return m.get("value") != "b"})) {
        t.set("value", t.get("value") + 1)
        t.get("tile").innerText = t.get("value")
    }
        
    let val = [...map.get("surrounding")].filter(m => {return m.get("value") == "b"}).length
    map.get("tile").classList.remove("bomb") 
    map.set("value", val)
    if (val > 0) map.get("tile").innerText = val

    for (const t of map.get("surrounding").filter(m => {return m.get("value") != "b"})) {
        t.set("value", t.get("value") - 1)
        if (t.get("value") > 0) t.get("tile").innerText = t.get("value")
        else {
            t.get("tile").innerText = ""
            for (const c of t.get("surrounding")) {
                reveal("", c)
            }
        }
    }
    return true
}

function flag(e) {
    e.preventDefault()
    let over = e.target
    let map = over.map
    over.classList.toggle("flag")
    map.set("flagged", !map.get("flagged"))
}

function clear(e) {
    e.preventDefault()
    let over = e.target
    let map = over.map
    if (!map.get("revealed") || map.get("surrounding").filter(m => {return m.get("flagged")}).length != map.get("value")) return
    for (const m of map.get("surrounding")) {
        if (m.get("flagged") || m.get("revealed")) continue
        reveal("", m)
    }
}

function reset() {
    starting = []
    document.body.style.backgroundColor = "white"
    if (layoutChanged) {
        layoutChanged = false
        document.querySelector(":root").style.setProperty("--size", size)
        generateGrids()
    }
    for (const map of tiles.values()) {
        map.set("value", 0)
        map.set("flagged", false)
        map.set("revealed", false)
        let over = map.get("over")
        let tile = map.get("tile")
        over.classList.remove("bomb")
        over.removeEventListener("click", reveal)
        over.addEventListener("click", reveal)
        over.classList.remove("flag")
        over.classList.remove("end")
        over.classList.remove("reveal")
        over.classList.remove("bomb")
        tile.classList.remove("bomb")
        tile.innerText = ""
    }
    generateBombs()
}

function filterSymbols(e) {
    if (["e", "."].includes(e.key)) e.preventDefault()
}

function update(input, params) {
    let value = input.value
    switch(params) {
        case "size":
            if (value > 50 && !confirm("Creating a big grid may cause lagginess, do you wish to proceed?")) {
                input.value = size
                break
            }
            size = value
            layoutChanged = true
            break;
        case "bombs":
            if (value > size * size - 1) {
                input.value = bombs
                alert("Number of bombs can't be more than the number of tiles")
                break
            }
            bombs = value
            break;
        case "width":
            width = value
            document.querySelector(":root").style.setProperty("--width", width + "px")
            break;
        default:
            break;
    }
}