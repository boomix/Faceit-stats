// Get steamID
const steamid = getSteamID();
loadFaceITProfile(steamid);

// Create global variables
let id, 
level, 
levelImg,
username, 
country, 
banned, 
banReason,
membership = '', 
elo = '', 
avgHS = '-',
avgKD = '-', 
matches = '-', 
winrate = '-',
registred = '';

function loadFaceITProfile(steamid) 
{
    // Check if steamID was recieved successfully
    if (steamid === null) {
        return;
    }

    // Get FaceIT profile
    chrome.runtime.sendMessage('https://api.faceit.com/search/v1/?limit=3&query=' + steamid,
        result => onFaceITProfileLoaded(result)
    );
}

async function onFaceITProfileLoaded(result) 
{
    const profile = await getMainProfile(result);
    
    if (profile !== null) {

        //Fill in start data
        id          = profile.guid;
        username    = profile.nickname;
        country     = profile.country;
        level       = getLevel(profile.games, 'csgo');
        levelImg    = chrome.runtime.getURL(`./img/levels/${level}.png`);

        updateDOM();
        
        // Check for bans
        chrome.runtime.sendMessage('https://api.faceit.com/sheriff/v1/bans/' + id,
            result => {
                if (result[0]) {
                    banned      = true;
                    banReason   = result[0].reason; 
                    updateDOM();
                }
            }
        );

        // Get additional data
        chrome.runtime.sendMessage('https://api.faceit.com/users/v1/nicknames/' + username,
            result => {
                membership  = ((result.memberships.includes('csgo') || result.memberships.includes('premium')) ? 'Premium' : 'Free')
                elo         = result.games.csgo.faceit_elo;
                registred = new Date(result.created_at).toLocaleString('en-us', {year: 'numeric', month: '2-digit', day: '2-digit'});
                updateDOM();
            }
        );

        // Get lifetime CS:GO stats
        chrome.runtime.sendMessage('https://api.faceit.com/stats/v1/stats/users/' + id + '/games/csgo',
            result => {
                avgHS   = result.lifetime.k8;
                avgKD   = result.lifetime.k5;
                matches = result.lifetime.m1;
                winrate =  result.lifetime.k6;
                updateDOM();
            }
        );

    }

}


function updateDOM() {
    //Select the element where to show faceit profile data
    const customize = (document.querySelector('.profile_customization_area') ?? document.querySelector('.profile_leftcol'));

    //Add the box with the data
    let textNode = document.createElement("div");
    textNode.id = 'facex';
    textNode.innerHTML = `
    <div class="profile_customization">
        <div class="profile_customization_header">FACE-X</div>
        <div class="profile_customization_block">
            <div class="favoritegroup_showcase">
                <div class="showcase_content_bg">
                    <div class="facex_content favoritegroup_showcase_group showcase_slot">                  
                        <div class="favoritegroup_content">
                            <div class="facex_namerow favoritegroup_namerow ellipsis" style="min-width:220px;float:left;margin-top: 10px;overflow:unset">
                                <img class="levelbox" src="${levelImg}">
                                <a class="favoritegroup_name whiteLink" target="_blank" href="https://www.faceit.com/en/players/`+ username + `">
                                    <img class="facex_country" title="${country}" src="https://cdn-frontend.faceit.com/web/112-1536332382/src/app/assets/images-compress/flags/${country}.png">
                                    ` + username + ` 
                                </a>
                                <br>
                                <span class="facex_description favoritegroup_description">
                                ` + ((banned) ? `<span alt="${banReason}" class="faceit-banned">${banReason}</span> ` : `<strong>${membership} - ${registred}</strong>`) + `
                                </span>
                            </div>
                            <div class="facex_stats_block">
                                <div class="facex_stats_row2 favoritegroup_stats showcase_stats_row">
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">${avgHS}%</div>
                                        <div class="label">AVG HS%</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">${avgKD}</div>
                                        <div class="label">AVG K/D</div>
                                    </div>
                                    
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">${elo}</div>
                                        <div class="label">ELO</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">${matches}</div>
                                        <div class="label">Matches</div>
                                    </div>
                                    <div class="facex_stat showcase_stat favoritegroup_online">
                                        <div class="value">${winrate}%</div>
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

    if (document.getElementById('facex')) {
        document.getElementById('facex').innerHTML = textNode.innerHTML;
    } else {
       customize.prepend(textNode); 
    }
}

function getLevel(games, searchGame) 
{
    let level = 1;
    games.map((game) => 
    {
        if (game.name === searchGame) {
            level = game.skill_level;
        }
    });

    return level;
}

/**
 * Gets last profile with CS:GO
 * @param {*} result 
 * @returns 
 */
async function getMainProfile(result) 
{
    let profile = null;
    const allPlayers = result.players.results;
    if (allPlayers.length > 1) {
        allPlayers.map(async (user, index) => {
            if (user.games.length > 0) {
                user.games.map(async (game) => {
                    if (game.name == 'csgo') {
                        profile = allPlayers[index];
                    }
                });
            }
        });
    } else {
        profile = allPlayers[0];
    }
    
    return profile;
}


/**
 * Gets steamID from page report popup
 * @returns string
 */
function getSteamID() 
{
    //Getting steamID from report popup
    if (document.getElementsByName("abuseID") && document.getElementsByName("abuseID")[0]) {
        return document.getElementsByName("abuseID")[0].value
    }

    //If steamID somehow is not found, then try second method to get it (user is not logged in)
    else {
        return document.querySelector('.responsive_page_template_content').innerHTML.split('script')[2].split('"')[8] ?? null;
    }
}
