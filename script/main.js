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

// cleaner //

const cleanContainer = (selector) => $(selector).innerHTML = ""


// API

const urlBase = `http://gateway.marvel.com/v1/public/`
let ts = `ts=1`
const publicKey = `&apikey=fce7b36328723d964caf6df4a1aa294c`
const hash = `&hash=7391644ad1562b5dbed2616db50485d4`

const defineResourceRequest = (resource , resourceID , plus) => {
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
    return baseURL
}

const definePath = (resource , resourceID , plus) => {
    const request = defineResourceRequest(resource , resourceID , plus)
    const url = `${request}?${ts}${publicKey}${hash}`
    return url
}

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


const printComics = async() => {
    const comics = await getComics()
    for (let comic of comics) {
        $("#results").innerHTML += `
        <div onclick= "showComicDetails(${comic.id})">
            <img src="${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}" alt="">
            <p>${comic.title}</p>
        </div>
        `
    }
}

const printCharacters = async() => {
    const characters = await getCharacters()
    for (let character of characters) {
        $("#results").innerHTML += `
        <div onclick= "showCharacterDetails(${character.id})">
            <img src="${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}" alt="">
            <p>${character.name}</p>
        </div>
        `
    }
}

const updateInfo = (selector , text) => $(selector).innerText = `${text}`

const showComicDetails = async(comicID) => {
    showScreen("#comicDetail")
    const comic = await requestData(definePath("comics" , comicID))

    $("#comicCover").src = `${comic[0].thumbnail.path}.${comic[0].thumbnail.extension}`

    updateInfo("#comicTitle" , comic[0].title)

    updateInfo("#comicDate" , new Intl.DateTimeFormat('es-AR').format(new Date(comic[0].dates.find((date) => date.type === 'onsaleDate').date)
    ))

    updateInfo("#comicCreators" , comic[0].creators.items
    .map((writer) => writer.name)
    .join(", ")
    )
    updateInfo("#comicDescription" , comic[0].description)
    console.log(comic)
}



// const showCharacterDetails = async() => {

// }


const initialize = async() => {
    printComics()
}

window.onload = initialize()
