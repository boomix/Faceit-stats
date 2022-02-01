const BEARER = 'Bearer 2ca58611-1bf4-4b37-b0a9-042631fd9f80';
const API_URL = 'https://open.faceit.com/data/v4';
/*
    Test page for extension - https://steamcommunity.com/id/boomix69
    SteamID is public steamcommunity.com value, that is available for everyone 
*/
let steamid = getSteamID();
if (steamid != null && !window.location.pathname.includes('/allcomments')) {
    //We get FACEIT.com username from public API
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", getFACEITusername);
    oReq.open("GET", API_URL + "/search/players?nickname=" + steamid + '&limit=5');
    oReq.setRequestHeader('Authorization', BEARER);
    oReq.send();
}

const levels = [
    'https://i.imgur.com/2qwSqFT.png', //1
    'https://i.imgur.com/K3nODQY.png', //2
    'https://i.imgur.com/nzujvVl.png', //3
    'https://i.imgur.com/wGKRvl7.png', //4
    'https://i.imgur.com/72vBPbV.png', //5
    'https://i.imgur.com/uItzYWr.png', //6
    'https://i.imgur.com/GWNSZjN.png', //7
    'https://i.imgur.com/V446r2j.png', //8
    'https://i.imgur.com/5U6OeHk.png', //9
    'https://i.imgur.com/GLBkCWN.png', //10

]
let matches, wins, winrate, avgKills, avgHs, avgKD, mainCountry, lastMatches = "";

function getFACEITusername() {
    let json = JSON.parse(this.responseText);
    let results = json.items;
    if (results.length == 0)
        return;


    //Get dafault data
    let defaultIndex = results.length - 1;
    let username = results[defaultIndex].nickname;
    let guid = results[defaultIndex].player_id;
    mainCountry = results[defaultIndex].country;


    //Check if we do not need to get other profile data, if there are multiple profiles and one of them has CS:GO
    results.forEach((user, index) => {
        if (user.games.length > 0) {
            user.games.forEach((game) => {
                if (game.name == 'csgo') {
                    username = results[index].nickname;
                    guid = results[index].player_id;
                }
            })
        }
    });

    //Get lifetime stats and once that is completed get FACEIT data
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
        json = JSON.parse(this.responseText);
        console.log(json);
        let lifetime = json.lifetime;
        matches = lifetime['Matches'];
        wins = lifetime['Wins'];
        winrate = lifetime['Win Rate %'];
        avgKD = lifetime['Average K/D Ratio'];
        avgHs = lifetime['Average Headshots %'];

        lifetime['Recent Results'].forEach(rr => {
            lastMatches += ((rr === "1") ? '<span style="color:#32d35a">W</span>' : '<span style="color:#ff002b">L</span>')
        })

        console.log(lastMatches)

    });
    oReq.open("GET", API_URL + "/players/" + guid + "/stats/csgo", true);
    oReq.setRequestHeader('Authorization', BEARER);
    oReq.send();
    oReq.onreadystatechange = function() {
        if (oReq.readyState == 4 && oReq.status == 200) {
            //Get main player info
            var oReq3 = new XMLHttpRequest();
            oReq3.addEventListener("load", getFACEITdata);
            oReq3.open("GET",  API_URL + "/players/" + guid, true);
            oReq3.setRequestHeader('Authorization', BEARER);
            oReq3.send();
        }
    }

    //Check if player is banned
    chrome.runtime.sendMessage( //goes to bg_page.js
        'https://api.faceit.com/sheriff/v1/bans/f5e5b77e-e827-44e5-a0a1-38083b0b460an',
        data => console.log(data)
    ); 
    

}

//Once the FACEIT.com username is recived, we get profile data from public API
function getFACEITdata() {
    let json = JSON.parse(this.responseText);
    console.log(json);

    let membership = json.memberships.includes('csgo') ? 'Premium' : 'Free';
    let level = json.games.csgo.skill_level;
    let elo = (json.games.csgo.faceit_elo) ? json.games.csgo.faceit_elo : '-';
    let nickname = json.nickname;
    let banned = (json.registration_status && json.registration_status == 'banned') ? json.registration_status : null;


    //Select the element where to show faceit profile data
    let customize = (document.querySelector('.profile_customization_area') ? document.querySelector('.profile_customization_area') : document.querySelector('.profile_leftcol'));


    //Add the box with the data
    var div = document.createElement("div");
    var textNode = document.createElement("div");
    textNode.innerHTML = `
    <div class="profile_customization">
        <div class="profile_customization_header">FACE-X</div>
        <div class="profile_customization_block">
            <div class="favoritegroup_showcase">
                <div class="showcase_content_bg">
                    <div class="facex_content favoritegroup_showcase_group showcase_slot">                  
                        <div class="favoritegroup_content">
                            <div class="facex_namerow favoritegroup_namerow ellipsis" style="min-width:220px;float:left;margin-top: 10px;overflow:unset">
                                <img class="levelbox" src="` + levels[level - 1] + `">
                                <a class="favoritegroup_name whiteLink" target="_blank" href="https://www.faceit.com/en/players/`+ nickname + `">
                                    <img class="facex_country" title="`+ mainCountry + `" src="https://cdn-frontend.faceit.com/web/112-1536332382/src/app/assets/images-compress/flags/` + mainCountry.toUpperCase() + `.png">
                                    `+ ((banned != null) ? `<span class="faceit-banned">ban</span> ` : '') + nickname + ` 
                                </a>
                                <br><span class="facex_description favoritegroup_description"><b>` + membership + `</b></span>
                            </div>
                            <div class="facex_stats_block">
                                <div class="facex_stats_row2 favoritegroup_stats showcase_stats_row">
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">`+ avgHs + `%</div>
                                        <div class="label">AVG HS%</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">`+ avgKD + `</div>
                                        <div class="label">AVG K/D</div>
                                    </div>
                                    
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">`+ elo + `</div>
                                        <div class="label">ELO</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">` + matches + `</div>
                                        <div class="label">Matches</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">`+ winrate + `%</div>
                                        <div class="label">WinRate</div>
                                    </div>
                                    <div style="clear: left;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    div.appendChild(textNode)
    customize.prepend(div);

}

function getSteamID() {

    let steamid = null;

    //Getting steamID from report popup
    if (document.getElementsByName("abuseID") && document.getElementsByName("abuseID")[0]) {
        steamid = document.getElementsByName("abuseID")[0].value
    }

    //If steamID somehow is not found, then try second method to get it (user is not logged in)
    else if (steamid == null) {
        steamid = document.querySelector('.responsive_page_template_content').innerHTML.split('script')[2].split('"')[8];
    }

    return steamid;
}
