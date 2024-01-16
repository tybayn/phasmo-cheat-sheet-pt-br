const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1,
             track[j - 1][i] + 1,
             track[j - 1][i - 1] + indicator,
          );
       }
    }
    return track[str2.length][str1.length];
 };

 let running_log = []

 $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
  
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status(){
    setTimeout(function(){
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    },1000)
}

function domovoi_show_last(){
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
}

function domovoi_hide_last(){
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src","imgs/domovoi.png")
}


function domovoi_heard(message){
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
    setTimeout(function() {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },2000)
}

function domovoi_not_heard(){
    $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function() {
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },3000)
}

function domovoi_print_logs(){
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item,idx){
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext){
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time":new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw":vtext
    })
    if(running_log.length > 5){
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if(vtext.startsWith('velocidade do fantasma')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized velocidade do fantasma command")
        running_log[cur_idx]["Type"] = "velocidade do fantasma"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('velocidade do fantasma', "").trim()
        domovoi_msg += "marcou a velocidade fantasma como "

        vtext = vtext.replace('três','3')
        vtext = vtext.replace('dois','2')
        vtext = vtext.replace('um','1')
        vtext = vtext.replace('zero','0')

        var smallest_num = '150'
        var smallest_val = 100
        var prev_value = document.getElementById("ghost_modifier_speed").value
        var all_ghost_speed = ['50','75','100','125','150']
        var all_ghost_speed_convert = {'50':0,'75':1,'100':2,'125':3,'150':4}

        for(var i = 0; i < all_ghost_speed.length; i++){
            var leven_val = levenshtein_distance(all_ghost_speed[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_ghost_speed[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("ghost_modifier_speed").value = all_ghost_speed_convert[smallest_num] ?? 2

        if(prev_value != all_ghost_speed_convert[smallest_num]){
            setTempo();
            bpm_calc(true);
            saveSettings();
            send_state()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.includes(' fantasma ')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized fantasma command")
        running_log[cur_idx]["Type"] = "fantasma"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ghost', "").trim()
        domovoi_msg += "marcado "

        var smallest_ghost = "Spirit"
        var smallest_val = 100
        var vvalue = 0
        if(vtext.startsWith("descartar ")){
            vtext = vtext.replace('descartar ', "").trim()
            vvalue = 0
            domovoi_msg = "descartado parcialmente "
        }
        else if(vtext.startsWith("resetar ")){
            vtext = vtext.replace('resetar ', "").trim()
            vvalue = 0
            domovoi_msg = "resetado "
        }
        else if(vtext.startsWith("selecionar ")){
            vtext = vtext.replace('selecionar ', "").trim()
            vvalue = 2
            domovoi_msg = "selecionado "
        }
        else if(vtext.startsWith("excluir ")){
            vtext = vtext.replace('excluir ', "").trim()
            vvalue = -1
            domovoi_msg = "descartado "
        }
        else if(vtext.startsWith("ver ")){
            vtext = vtext.replace('ver ', "").trim()
            vvalue = -10
            domovoi_msg = "visualizada informação de "
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_ghosts.length; i++){
            var leven_val = levenshtein_distance(all_ghosts[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_ghost = all_ghosts[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == 0){
            fade(document.getElementById(smallest_ghost));
        }
        else if (vvalue == 3){
            guess(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == 2){
            select(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == -1){
            remove(document.getElementById(smallest_ghost));
        }
        else if (vvalue == -2){
            died(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if(vvalue == -10){
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.includes('evidência')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidência command")
        running_log[cur_idx]["Type"] = "evidência"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('evidência', "").replace("marcar ","").trim()
        domovoi_msg += "marcada evidência sendo "

        var smallest_evidence = "emf nível 5"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("descartar ")){
            vtext = vtext.replace('descartar ', "").trim()
            vvalue = -1
            domovoi_msg = "descartada evidência "
        }
        else if(vtext.startsWith("resetar ")){
            vtext = vtext.replace('resetar ', "").trim()
            vvalue = 0
            domovoi_msg = "resetada "
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }


        for(var i = 0; i < all_evidence.length; i++){
            var leven_val = levenshtein_distance(all_evidence[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = all_evidence[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if(!$(document.getElementById(smallest_evidence).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"bad":-1,"neutral":0}[document.getElementById(smallest_evidence).querySelector("#checkbox").classList[0]]){
                tristate(document.getElementById(smallest_evidence));
            }
        }
        else{
            domovoi_msg = `Evidência ${smallest_evidence} está bloqueada!`
        }
        

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('mão do macaco ')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mão do macaco command")
        running_log[cur_idx]["Type"] = "mão do macaco"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('mão do macaco ', "").trim()
        domovoi_msg += "marcada "

        var smallest_evidence = "emf nível 5"
        var smallest_val = 100
        var vvalue = 1

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_evidence.length; i++){
            var leven_val = levenshtein_distance(all_evidence[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = all_evidence[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += `${smallest_evidence} como descartada pela mão do macaco`

        monkeyPawFilter($(document.getElementById(smallest_evidence)).parent().find(".monkey-paw-select"))

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.includes('velocidade')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized velocidade command")
        running_log[cur_idx]["Type"] = "velocidade"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('velocidade', "").trim()
        domovoi_msg += "marcada velocidade "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("descartar ")){
            vtext = vtext.replace('descartar ', "").trim()
            vvalue = 0
            domovoi_msg = "velocidade descartada "
        }
        else if(vtext.startsWith("resetar ")){
            vtext = vtext.replace('resetar ', "").trim()
            vvalue = -1
            domovoi_msg = "resetada "
        }

        if (vvalue == -1){
            vvalue = 0
        }

        // Common replacements for speed
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['speed'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_speed.length; i++){
            var leven_val = levenshtein_distance(all_speed[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_speed = all_speed[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
        domovoi_msg += smallest_speed

        if(!$(document.getElementById(smallest_speed).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"neutral":0}[document.getElementById(smallest_speed).querySelector("#checkbox").classList[0]]){
                dualstate(document.getElementById(smallest_speed));
            }
        }
        else{
            domovoi_msg = `Velocidade ${smallest_speed} está bloqueada!`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if (vtext.endsWith("linha de visão") || vtext.startsWith("aceleração")){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized linha de visão command")
        running_log[cur_idx]["Type"] = "linha de visão"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace(' linha de visão', "").replace('aceleração ', "").replace("normal","").trim()
        domovoi_msg += "marcada aceleração normal"

        var vvalue = 1
        if(vtext.endsWith("incomum ")){
            vtext = vtext.replace('incomum ', "").trim()
            vvalue = 0
            domovoi_msg = "marcada aceleração incomum"
        }
        else if(vtext.startsWith("resetar ")){
            vtext = vtext.replace('resetar ', "").trim()
            vvalue = -1
            domovoi_msg = "linha de visão resetada"
        }

        if((vvalue==0 && all_los()) || (vvalue==1 && all_not_los())){
            domovoi_msg = `${vvalue == 0 ? 'Todos os fantasmas atuais têm linha de visão' : 'Nenhum fantasma atual tem linha de visão'}!`
        }
        else{
            while (!$(document.getElementById("LOS").querySelector("#checkbox")).hasClass(["neutral","bad","good"][vvalue+1])){
                tristate(document.getElementById("LOS"));
            }
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.includes('sanidade')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized sanidade command")
        running_log[cur_idx]["Type"] = "sanidade"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('sanidade', "").trim()
        domovoi_msg += "sanidade de caça marcada "

        var smallest_sanity = "Tarde"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("descartar ")){
            vtext = vtext.replace('descartar ', "").trim()
            vvalue = 0
            domovoi_msg = "sanidade de caça descartada "
        }
        else if(vtext.startsWith("resetar ")){
            vtext = vtext.replace('resetar ', "").trim()
            vvalue = 0
            domovoi_msg = "resetada "
        }

        // Common replacements for sanity
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['sanity'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_sanity.length; i++){
            var leven_val = levenshtein_distance(all_sanity[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_sanity = all_sanity[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_sanity}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_sanity}`
        domovoi_msg += smallest_sanity.replace("Average","Normal")

        if(!$(document.getElementById(smallest_sanity).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"neutral":0}[document.getElementById(smallest_sanity).querySelector("#checkbox").classList[0]]){
                dualstate(document.getElementById(smallest_sanity),false,true);
            }
        }
        else{
            domovoi_msg = `Sanidade ${smallest_sanity} está bloqueada!`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.endsWith(' temporizador')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized temporizador command")
        running_log[cur_idx]["Type"] = "temporizador"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace(' temporizador', "").trim()
        

        if(vtext == "iniciar"){
            domovoi_msg += "iniciado o temporizador do incenso"
            toggle_timer(true,false)
            send_timer(true,false)
        } 
        else{
            domovoi_msg += "interrompido o temporizador do incenso"
            toggle_timer(false,true)
            send_timer(false,true)
        }
        

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.endsWith(' espera')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized espera command")
        running_log[cur_idx]["Type"] = "espera"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace(' espera', "").trim()
        
        if(vtext == "iniciar"){
            domovoi_msg += "iniciado o temporizador de tempo de espera de caça"
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else{
            domovoi_msg += "interrompido o temporizador de tempo de espera de caça"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('quantidade de evidências')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized quantidade de evidências command")
        running_log[cur_idx]["Type"] = "quantidade de evidências"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('quantidade de evidências', "").trim()
        domovoi_msg += "define # de evidências para "

        vtext = vtext.replace('três','3')
        vtext = vtext.replace('dois','2')
        vtext = vtext.replace('um','1')
        vtext = vtext.replace('zero','0')

        var smallest_num = 3
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ['0','1','2','3']

        for(var i = 0; i < all_difficulty.length; i++){
            var leven_val = levenshtein_distance(all_difficulty[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("num_evidence").value = smallest_num ?? 3
        if(prev_value != smallest_num){
            filter()
            flashMode()
            saveSettings()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('mostrar filtros') || vtext.startsWith('mostrar Ferramentas')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filtros/ferramentas command")
        running_log[cur_idx]["Type"] = "filtros/ferramentas"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "alternado menu"

        toggleFilterTools()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('mostrar mapa')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mapa command")
        running_log[cur_idx]["Type"] = "mapa"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('mostrar mapa', "").trim()
        domovoi_msg = "exibindo mapa"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
        showMaps(true,false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('esconder mapa')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mapa command")
        running_log[cur_idx]["Type"] = "mapa"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "ocultando mapa"

        showMaps(false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('resetar guia phasmophobia')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized resetar command")
        console.log(`Heard '${vtext}'`)
        if(Object.keys(discord_user).length > 0){
            if(!hasSelected()){
                $("#reset").removeClass("standard_reset")
                $("#reset").addClass("reset_pulse")
                $("#reset").html("Nenhum fantasma selecionado!<div class='reset_note'>(say 'force reset' to save & reset)</div>")
                $("#reset").prop("onclick",null)
                $("#reset").prop("ondblclick","reset()")
                reset_voice_status()
            }
            else{
                reset()
            }
        }
        else{
            reset()
        }
    }
    else if(vtext.startsWith('parar de detectar voz')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized parar de detectar voz command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    }
    else if(
        vtext.startsWith("olá domo")
    ){
        if(Object.keys(discord_user).length > 0){
            domovoi_heard(`olá ${discord_user['username']}!`)
        }
        else{
            domovoi_heard("olá!")
        }
        
        reset_voice_status()
    }
    else if(
        vtext.startsWith("mover domo")
    ){
        if (user_settings['domo_side'] == 0){
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        }
        else{
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()
        
        reset_voice_status()
    }
    else{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && !navigator.userAgent.toLowerCase().match(/firefox|fxios|opr/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new speechRecognition();
    let stop_listen = true
  
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'pt-BR';
  
    speechRecognition.onend = () => {
        if(!stop_listen){
            speechRecognition.start(auto=true);
        }
    }

    speechRecognition.onspeechstart = () =>{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) =>{
        if(error.error != "no-speech")
            console.log(error)
    }
  
    speechRecognition.onresult = (event) => {
        let final_transcript = "";
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };
    
    function start_voice(auto=false){
        stop_listen = false
        if(!auto){
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("voice_recognition_on",true,0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice(){
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("voice_recognition_on",false,-1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

  } else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "Browser not supported"
    console.log("Speech Recognition Not Available");
  }

