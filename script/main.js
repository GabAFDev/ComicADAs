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

let total = 0

const updateTotal = (count) => {
    $(".resultsCount").innerText = count
    total = count
}

// ---------------------- API ----------------------//

// API url definition 

const urlBase = `http://gateway.marvel.com/v1/public/`
let ts = `ts=1`
const publicKey = `&apikey=fce7b36328723d964caf6df4a1aa294c`
const hash = `&hash=7391644ad1562b5dbed2616db50485d4`
let offset = 0


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

const getCharacters = async() => {
    const characters = await requestData(definePath("characters"))
    return characters
}

//API requests Totals

const requestCount = async(url) => {
    const response = await fetch(url)
    const data = await response.json()
    return data.data.total
}

const getComicsTotal = async() => {
    const total = await requestCount(definePath("comics"))
    updateTotal(total)
    return total
}

const getCharactersTotal = async() => {
    const total = await requestCount(definePath("characters"))
    updateTotal(total)
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

    const characters = await requestData(definePath("comics" , comicID , "characters"))
    const total = characters.length

    updateTotal(total)
    updatePagination(total)
    updateInfo("#resultsTitle" , "Personajes")
    cleanContainer("#results")
    printCharacters(characters)
}

const showCharacterDetails = async(characterID) => {
    show("#characterDetail")
    hide("#comicDetail")
    const character = await requestData(definePath("characters" , characterID))

    $("#characterImage").src = `${character[0].thumbnail.path}.${character[0].thumbnail.extension}`

    updateInfo("#characterName" , character[0].name)

    updateInfo("#characterDescription" , character[0].description)

    
    const comics = await requestData(definePath("characters" , characterID , "comics"))
    const total = comics.length
    updateTotal(total)
    updatePagination(total)
    updateInfo("#resultsTitle" , "Comics")
    cleanContainer("#results")
    printComics(comics)
}

// Search and defining sort by 

const search = async() => {
    const value = $("#type").value
    cleanContainer("#results")
    if (value === "comics") {
        total = await getComicsTotal()
        printComics(requestData(definePath("comics")))
    } else {
        total = await getCharactersTotal()
        printCharacters(requestData(definePath("characters")))
    }
    updatePagination(total)
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

const updatePagination = (total) => {
    if (offset === 0) {
        $("#first").disabled = true
        $("#previous").disabled = true
    } else {
        $("#first").disabled = false
        $("#previous").disabled = false
    }
    if ((offset + 20) >= total) {
        $("#last").disabled = true
        $("#next").disabled = true
    } else {
        $("#last").disabled = false
        $("#next").disabled = false
    }
}

// Initialilize

const initialize = async() => {
    printComics(getComics())
    updateSorting()
    updateTotal(await getComicsTotal())
    updatePagination()

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
        updatePagination(total)
    })

    $("#previous").addEventListener("click" , () => {
        previousPage()
        updatePagination(total)
    })

    $("#next").addEventListener("click" , () => {
        nextPage()
        updatePagination(total)
    })

    $("#last").addEventListener("click" , () => {
        lastPage()
        updatePagination(total)
    })
}

window.onload = initialize()
