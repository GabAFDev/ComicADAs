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
    let baseURL = `${urlBase}/${resource}`

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

const requestData = async() => {
    const path = definePath("comics")
    const response = await fetch(path)
    const data = await response.json()
    console.log(data)
    return data
}

requestData()

// const printResults = () => {

// }

// const initialize = () => {
//     requestData(comics)
// }