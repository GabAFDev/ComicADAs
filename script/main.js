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

// Total counter

let total = 0

const updateTotal = (count) => {
    $(".resultsCount").innerText = count
    total = count
}

const resetOffset = () => {
    offset = 0
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
        <div onclick= "showComicDetails(${comic.id})" class="hover:text-red-600">
            <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="" class="mt-[10 px] drop-shadow-2xl hover:-translate-y-3 hover:transition hover:aduration-250">
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
            <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="" class="w-[100%] mt-[5 px] ">
            <p class="font-bold text-white bg-black min-h-[4rem]">${character.name}</p>
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

    resetOffset()
    const characters = await requestData(definePath("comics" , comicID , "characters"))
    const total = await requestCount(definePath("comics" , comicID , "characters"))
    console.log(total);

    updateInfo("#resultsTitle" , "Personajes")
    cleanContainer("#results")
    console.log(offset);
    updateTotal(total)
    printCharacters(characters)
    pagination(async() => printCharacters(await getComicCharacters(comicID)))
    updatePagination(total)
}

const showCharacterDetails = async(characterID) => {
    show("#characterDetail")
    hide("#comicDetail")
    const character = await requestData(definePath("characters" , characterID))

    $("#characterImage").src = `${character[0].thumbnail.path}.${character[0].thumbnail.extension}`

    updateInfo("#characterName" , character[0].name)

    updateInfo("#characterDescription" , character[0].description)

    resetOffset()
    const comics = await requestData(definePath("characters" , characterID , "comics"))
    const total = await requestCount(definePath("characters" , characterID , "comics"))
    console.log(total);
    console.log(offset);

    updateInfo("#resultsTitle" , "Comics")
    cleanContainer("#results")
    updateTotal(total)
    printComics(comics)
    pagination(() => printComics(getCharacterComics(characterID)))
    updatePagination(total)
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

const pagination = (searchPath) => {
    $("#first").onclick = () => {
        cleanContainer("#results")
        offset = 0
        searchPath()
        updatePagination(total)
    }

    $("#previous").onclick = () => {
        cleanContainer("#results")
        offset -= 20
        if (offset < 0) {
            offset = 0
        }
        searchPath()
        updatePagination(total)
    }

    $("#next").onclick = () => {
        cleanContainer("#results")
        offset += 20
        searchPath()
        console.log(offset);
        updatePagination(total)
    }

    $("#last").onclick = () => {
        cleanContainer("#results")
        const pages = Math.floor(total / 20)
        offset = (total % 20 ===0)? pages -1 : pages * 20
        searchPath()
        updatePagination(total)
    }
}


const updatePagination = (total) => {
    console.log(offset);
    if (offset === 0) {
        $("#first").disabled = true
        $("#previous").disabled = true
    } 
    if (offset > 0) {
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
    pagination(search)

    $("#searchButton").addEventListener("click" , () => {
        updateInfo("#resultsTitle" , "Resultados")
        hide("#comicDetail")
        hide("#characterDetail")
        offset = 0
        search()
        pagination(search)
    })

    $("#type").addEventListener("click" , () => {
        updateSorting()
    })
}
window.onload = initialize()
