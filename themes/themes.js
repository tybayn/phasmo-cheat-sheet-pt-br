const themes = {
    "Padrão": "theme-default",
    "Baga": "theme-berry",
    "Preto e branco": "theme-black-white",
    "Anoitecer": "theme-dusk",
    "Frost": "theme-frost",
    "Halloween": "theme-halloween",
    "Northern Lights": "theme-northern-lights",
    "Orgulho": "theme-pride",
    "Abeto": "theme-spruce",
    "Aço": "theme-steel",
    "Pôr do sol": "theme-sunset",
    "Crepúsculo": "theme-twilight",
    "ZN-Elite" : "theme-zn"
}

function loadThemes(){
    let theme_options = ""
    Object.keys(themes).forEach((key) => {
        theme_options += `<option value="${key}">${key}</option>`
    })
    $("#theme").html(theme_options)
}

function changeTheme(name = null){

    let changeObjects = [
        ".ghost_card",".menu","#settings_box","#settings_tab",
        "#event_box","#event_tab","#wiki_box","#wiki_tab",
        "#maps_box","#maps_tab","#language_box","#language_tab",
        "#theme_box","#theme_tab","#info_box","#info_box_voice"
    ]

    let theme_name = name != null ? name : $("#theme").val()

    changeObjects.forEach((item) => {
        $(item).removeClass(Object.values(themes))
        $(item).addClass(themes[theme_name])
    })
}