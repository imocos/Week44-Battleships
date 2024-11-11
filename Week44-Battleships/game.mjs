import { ANSI } from "./utils/ansi.mjs";
import { print, clearScreen } from "./utils/io.mjs";
import SplashScreen from "./game/splash.mjs";  
import { FIRST_PLAYER, SECOND_PLAYER } from "./consts.mjs";
import createMenu from "./utils/menu.mjs";
import createMapLayoutScreen from "./game/mapLayoutScreen.mjs";
import createInnBetweenScreen from "./game/innbetweenScreen.mjs";
import createBattleshipScreen from "./game/battleshipsScreen.mjs";
import DICTIONARY from "./utils/dictionary.mjs";

const MIN_COLUMNS = 80;
const MIN_ROWS = 24;

let currentLanguage = "en"; 
const MAIN_MENU_ITEMS = buildMenu();
const GAME_FPS = 1000 / 60;
let currentState = null;
let gameLoop = null;
let mainMenuScene = null;


(function initialize() {
    checkResolution();

    print(ANSI.HIDE_CURSOR);
    clearScreen();
    mainMenuScene = createMenu(MAIN_MENU_ITEMS);
    SplashScreen.next = mainMenuScene;
    currentState = SplashScreen; 

    gameLoop = setInterval(update, GAME_FPS); 
})();

function update() {
    currentState.update(GAME_FPS);
    currentState.draw(GAME_FPS);

    if (currentState.transitionTo != null) {
        currentState = currentState.next;
        print(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
    }
}


function t(key, replacements = {}) {
    let text = DICTIONARY[currentLanguage][key] || key;

    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }

    return text;
}

function createLanguageMenu() {
    const languageOptions = Object.keys(DICTIONARY).map((langCode, index) => ({
        text: langCode.toUpperCase(), 
        id: index,
        action: function () {
            currentLanguage = langCode;  
            console.log(`Language set to: ${langCode.toUpperCase()}`);

            currentState.next = createMenu(buildMenu());  
            currentState.transitionTo = t("MENU");
        },
    }));

    languageOptions.push({
        text: t("BACK"), 
        id: languageOptions.length,
        action: function () {
            currentState.next = createMenu(buildMenu());  
            currentState.transitionTo = t("MENU");
        },
    });

    return createMenu(languageOptions);
}

function buildMenu() {
    let menuItemCount = 0;
    return [
        {
            text: t("START_GAME"),
            id: menuItemCount++,
            action: function () {
                clearScreen();
                let innbetween = createInnBetweenScreen();
                innbetween.init(t("SHIP_PLACEMENT", { playerName: t("PLAYER") + "1" }), () => {
                    let p1map = createMapLayoutScreen();
                    p1map.init(FIRST_PLAYER, (player1ShipMap) => {
                        let innbetween = createInnBetweenScreen();
                        innbetween.init(t("SHIP_PLACEMENT", { playerName: t("PLAYER") + "2" }), () => {
                            let p2map = createMapLayoutScreen();
                            p2map.init(SECOND_PLAYER, (player2ShipMap) => {
                                return createBattleshipScreen(player1ShipMap, player2ShipMap);
                            });
                            return p2map;
                        });
                        return innbetween;
                    });
                    return p1map;
                }, 3);
                currentState.next = innbetween;
                currentState.transitionTo = t("SHIP_PLACEMENT");
            },
        },
        {
            text: t("LANGUAGE_SETTINGS"),
            id: menuItemCount++,
            action: function () {
                const languageMenu = createLanguageMenu(); 
                currentState.next = languageMenu;
                currentState.transitionTo = t("LANGUAGE_SETTINGS");
            },
        },
        {
            text: t("EXIT_GAME"),
            id: menuItemCount++,
            action: function () {
                print(ANSI.SHOW_CURSOR);
                clearScreen();
                process.exit();
            },
        },
    ];
}



function isResolutionAdequate() {
    const { columns, rows } = process.stdout;
    return columns >= MIN_COLUMNS && rows >= MIN_ROWS;
}

function checkResolution() {
    if (!isResolutionAdequate()) {
        console.log(t("RESOLUTION_ERROR", {
            columns: MIN_COLUMNS,
            rows: MIN_ROWS,
            currentColumns: process.stdout.columns,
            currentRows: process.stdout.rows,
        }));
        console.log(t("RESIZE_TERMINAL"));
        process.exit(1);
    }
}