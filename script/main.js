// ---------------------- UTILITIES ----------------------//

// query selectors //

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)

// show screen //

const showScreen = (screenName) => {
    const screens = $$('.screen')

    for (let screen of screens) {
        screen.classList.add('hidden')
    }

    $(`${screenName}`).classList.remove('hidden')
}

const show = (selector) => $(`${selector}`).classList.remove('hidden')

const hide = (selector) => $(`${selector}`).classList.add('hidden')

// cleaner //

const cleanContainer = (selector) => $(selector).innerHTML = ""
// Text updater

const updateInfo = (selector , text) => $(selector).innerText = `${text}`

// ---------------------- API ----------------------//

// API url definition 

const urlBase = `http://gateway.marvel.com/v1/public/`
let ts = `ts=1`
const publicKey = `&apikey=fce7b36328723d964caf6df4a1aa294c`
const hash = `&hash=7391644ad1562b5dbed2616db50485d4`
let offset = 0
let total = 0


// Filters 

const defineFilters = (resource) => {
    const search = $("#searchInput")
    const type = $("#type")
    const sortBy = $("#sortBy")

    let filters = `?${ts}${publicKey}${hash}&offset=${offset}`

    

    if (!resource) {
        return filters
    }

    filters += `&orderBy=${sortBy.value}`

    if (!search.value.length) {
        return filters
    }

    if (type.value === "comics") {
        filters += `&titleStartsWith=${search.value}`
    }

    if (type.value === "characters") {      
        filters += `&nameStartsWith=${search.value}`
    }

    return filters 
}

const definePath = (resource , resourceID , plus) => {
    const simpleSearch = !resourceID && !plus
    let baseURL = `${urlBase}${resource}`

    if (!resourceID && !plus) {
        baseURL
    }

    if (resourceID) {
        baseURL += `/${resourceID}`
    }
    if (plus) {
        baseURL += `/${plus}`
    }
    return baseURL += defineFilters(simpleSearch)
}



//API requests Results

const requestData = async(url) => {
    const response = await fetch(url)
    const data = await response.json()
    return data.data.results
}

const getComics = async() => {
    const comics = await requestData(definePath("comics"))
    return comics
}

const getComicCharacters = async(comicID) => {
    const comicCharacters = await requestData(definePath("comics" , comicID , "characters"))
    return comicCharacters
}

const getCharacters = async() => {
    const characters = await requestData(definePath("characters"))
    return characters
}

const getCharacterComics = async(characterID) => {
    const characterComics = await requestData(definePath("characters" , characterID , "comics"))
    return characterComics
}

//API requests Totals

const requestCount = async(url) => {
    const response = await fetch(url)
    const data = await response.json()
    total =  data.data.total
    return total
}

const getComicsTotal = async() => {
    const total = await requestCount(definePath("comics"))
    updateInfo(".resultsCount" , total)
    return total
}

const getCharactersTotal = async() => {
    const total = await requestCount(definePath("characters"))
    updateInfo(".resultsCount" , total)
    return total
}

// printers

const printComics = async(path) => {
    const comics = await path
    for (let comic of comics) {
        $("#results").innerHTML += `
        <div onclick= "showComicDetails(${comic.id})">
            <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="" class="mt-[5 px]">
            <p class="font-bold mt-[15px]">${comic.title}</p>
        </div>
        `
    }
}

const printCharacters = async(path) => {
    const characters = await path
    for (let character of characters) {
        $("#results").innerHTML += `
        <div onclick= "showCharacterDetails(${character.id})">
            <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="" class="mt-[5 px]">
            <p class="font-bold text-white bg-red-700">${character.name}</p>
        </div>
        `
    }
}

// Showing details

const showComicDetails = async(comicID) => {
    show("#comicDetail")
    hide("#characterDetail")
    const path = definePath("comics" , comicID)
    const comic = await requestData(path)

    $("#comicCover").src = `${comic[0].thumbnail.path}.${comic[0].thumbnail.extension}`

    updateInfo("#comicTitle" , comic[0].title)

    updateInfo("#comicDate" , new Intl.DateTimeFormat('es-AR').format(new Date(comic[0].dates.find((date) => date.type === 'onsaleDate').date)
    ))

    updateInfo("#comicCreators" , comic[0].creators.items
    .map((writer) => writer.name)
    .join(", ")
    )
    updateInfo("#comicDescription" , comic[0].description)

    updateInfo("#resultsTitle" , "Personajes")
    cleanContainer("#results")
    const characters = await getComicCharacters(comicID)
    printCharacters(characters)
    total = characters.length
    updateInfo(".resultsCount" , total)
}

const showCharacterDetails = async(characterID) => {
    show("#characterDetail")
    hide("#comicDetail")
    cleanContainer("#results")
    const character = await requestData(definePath("characters" , characterID))

    $("#characterImage").src = `${character[0].thumbnail.path}.${character[0].thumbnail.extension}`

    updateInfo("#characterName" , character[0].name)

    updateInfo("#characterDescription" , character[0].description)

    updateInfo("#resultsTitle" , "Comics")
    const comics = await getCharacterComics(characterID)
    printComics(comics)
    total = comics.length
    updateInfo(".resultsCount" , total)
}

// Search and defining sort by 

const search = () => {
    const value = $("#type").value
    cleanContainer("#results")
    if (value === "comics") {
        getComicsTotal()
        printComics(requestData(definePath("comics")))
    } else {
        getCharactersTotal()
        printCharacters(requestData(definePath("characters")))
    }
}

const updateSorting = () => {
    const value = $("#type").value

    if (value === "comics") {
        $("#sortBy").innerHTML = `
            <option value="title">A-Z</option>
            <option value="-title">Z-A</option>
            <option value="-onsaleDate">Más nuevos</option>
            <option value="onsaleDate">Más viejos</option>
        `
    }

    if (value === "characters") {
        $("#sortBy").innerHTML = `
            <option value="name">A-Z</option>
            <option value="-name">Z-A</option>
        `
    }
}

// Pagination

const firstPage = () => {
    offset = 0
    search()
}

const nextPage = () => {
    offset += 20
    search()
}

const previousPage = () => {
    offset -= 20
    if (offset < 0) {
        offset = 0
    }
    search()
}

const lastPage = () => {
    const pages = Math.floor(total / 20)
    offset = (total % 20 ===0)? pages -1 : pages * 20
    search()
}

// Initialilize

const initialize = () => {
    printComics(getComics())
    updateSorting()
    getComicsTotal()
    $("#searchButton").addEventListener("click" , () => {
        updateInfo("#resultsTitle" , "Resultados")
        hide("#comicDetail")
        hide("#characterDetail")
        offset = 0
        search()
    })
    $("#type").addEventListener("click" , () => {
        updateSorting()
    })
    $("#first").addEventListener("click" , () => {
        firstPage()
    })
    $("#previous").addEventListener("click" , () => {
        previousPage()
    })
    $("#next").addEventListener("click" , () => {
        nextPage()
    })
    $("#last").addEventListener("click" , () => {
        lastPage()
    })
}

window.onload = initialize()
