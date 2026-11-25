
/* =========================================
   PARTY SCORE
   THEME SYSTEM
========================================= */


/* 01. プリセットテーマ
========================================= */

const THEMES = {

    christmas: {
        name: "Frozen Christmas",
        colors: [
            "#193D40",
            "#2B5155",
            "#783346",
            "#DAF0F2"
        ]
    },

    mint: {
        name: "Creamy Mint",
        colors: [
            "#BCE4D3",
            "#503C34",
            "#362925",
            "#DCC2AA"
        ]
    },

    sunset: {
        name: "Cotton Candy Sky",
        colors: [
            "#393B53",
            "#50516B",
            "#E0B4D2",
            "#F1CDD3"
        ]
    },

    strawberry: {
        name: "Classic Shortcake",
        colors: [
            "#F5EEE4",
            "#FFFAF5",
            "#B94B5B",
            "#E9B9BE"
        ]
    },

    ocean: {
        name: "Deep Blue",
        colors: [
            "#101522",
            "#1C263B",
            "#376ED9",
            "#C9D9F5"
        ]
    },

    tropical: {
        name: "Citrus Pop",
        colors: [
            "#F0EDD4",
            "#F7F8EF",
            "#79A85D",
            "#E8CE70"
        ]
    }

};


const THEME_STORAGE_KEY = "party-score-theme-v1";


/* 02. 初期設定
========================================= */

function defaultThemeSettings() {

    return {

        selected: "christmas",

        custom: [
            ...THEMES.christmas.colors
        ],

        showBear: true

    };

}


/* 03. カラーコードの確認
========================================= */

function validColor(color) {

    return (
        typeof color === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(color)
    );

}


/* 04. 保存された設定の読み込み
========================================= */

function loadThemeSettings() {

    const defaults = defaultThemeSettings();

    try {

        const saved = JSON.parse(
            localStorage.getItem(THEME_STORAGE_KEY)
        ) || {};

        const selected =

            saved.selected === "custom" ||
            Object.hasOwn(THEMES, saved.selected)

                ? saved.selected
                : defaults.selected;

        const custom = defaults.custom.map(
            (color, index) => {

                if (
                    Array.isArray(saved.custom) &&
                    validColor(saved.custom[index])
                ) {

                    return saved.custom[index];

                }

                return color;

            }
        );

        return {

            selected,

            custom,

            showBear: saved.showBear !== false

        };

    } catch (error) {

        console.warn(
            "テーマの読み込みに失敗しました",
            error
        );

        return defaults;

    }

}


let themeSettings = loadThemeSettings();


/* 05. テーマ設定の保存
========================================= */

function saveThemeSettings() {

    try {

        localStorage.setItem(
            THEME_STORAGE_KEY,
            JSON.stringify(themeSettings)
        );

    } catch (error) {

        console.warn(
            "テーマ設定を保存できませんでした",
            error
        );

    }

}


/* 06. 色の変換
========================================= */

function hexToRgb(hex) {

    return [

        parseInt(hex.slice(1, 3), 16),

        parseInt(hex.slice(3, 5), 16),

        parseInt(hex.slice(5, 7), 16)

    ];

}


function rgbToHex(rgb) {

    return "#" + rgb.map(value =>

        Math.round(
            Math.max(0, Math.min(255, value))
        )

        .toString(16)

        .padStart(2, "0")

    ).join("").toUpperCase();

}


/* 07. 色の調整
========================================= */

function mixColors(color1, color2, ratio) {

    const a = hexToRgb(color1);

    const b = hexToRgb(color2);

    return rgbToHex(

        a.map((value, index) =>

            value * (1 - ratio)
            + b[index] * ratio

        )

    );

}


function darkenColor(color, amount) {

    return mixColors(
        color,
        "#000000",
        amount
    );

}


function lightenColor(color, amount) {

    return mixColors(
        color,
        "#FFFFFF",
        amount
    );

}


/* 08. 文字の視認性
========================================= */

function relativeLuminance(color) {

    const rgb = hexToRgb(color).map(value => {

        const n = value / 255;

        return n <= 0.04045

            ? n / 12.92

            : Math.pow(
                (n + 0.055) / 1.055,
                2.4
            );

    });

    return (

        0.2126 * rgb[0] +

        0.7152 * rgb[1] +

        0.0722 * rgb[2]

    );

}


function contrastRatio(color1, color2) {

    const a = relativeLuminance(color1);

    const b = relativeLuminance(color2);

    return (

        Math.max(a, b) + 0.05

    ) / (

        Math.min(a, b) + 0.05

    );

}


/* 背景に応じた文字色 */

function readableText(background) {

    const light = "#EDE9E3";

    const dark = "#171717";

    const lightContrast =
        contrastRatio(background, light);

    const darkContrast =
        contrastRatio(background, dark);

    if (
        Math.max(
            lightContrast,
            darkContrast
        ) >= 4.5
    ) {

        return lightContrast >= darkContrast
            ? light
            : dark;

    }

    return contrastRatio(

        background,
        "#FFFFFF"

    ) >= contrastRatio(

        background,
        "#000000"

    )

        ? "#FFFFFF"
        : "#000000";

}


/* 文字色のコントラスト調整 */

function ensureContrast(color, background) {

    let result = color;

    const target =

        contrastRatio(background, "#000000") >=
        contrastRatio(background, "#FFFFFF")

            ? "#000000"
            : "#FFFFFF";

    for (let i = 0; i < 100; i++) {

        if (
            contrastRatio(
                result,
                background
            ) >= 4.5
        ) {

            return result;

        }

        const next = mixColors(
            result,
            target,
            0.06
        );

        if (next === result) break;

        result = next;

    }

    return target;

}


/* 旧コードとの互換性 */

function readableBackground(
    color,
    text = "#EDE9E3"
) {

    let result = color;

    const target =

        contrastRatio(text, "#000000") >=
        contrastRatio(text, "#FFFFFF")

            ? "#000000"
            : "#FFFFFF";

    for (let i = 0; i < 100; i++) {

        if (
            contrastRatio(
                result,
                text
            ) >= 4.5
        ) {

            return result;

        }

        const next = mixColors(
            result,
            target,
            0.05
        );

        if (next === result) break;

        result = next;

    }

    return target;

}


function readableAccent(color, background) {

    return ensureContrast(
        color,
        background
    );

}


/* 09. 選択中のカラーを取得
========================================= */

function getThemeColors() {

    if (themeSettings.selected === "custom") {

        return themeSettings.custom.map(
            (color, index) =>

                validColor(color)

                    ? color

                    : THEMES.christmas.colors[index]

        );

    }

    return (

        THEMES[themeSettings.selected]

        || THEMES.christmas

    ).colors;

}


/* 10. テーマの適用
========================================= */

function applyTheme() {

    const [

        base,

        card,

        accent,

        decoration

    ] = getThemeColors();


    const root = document.documentElement;

    const selected = themeSettings.selected;


    /* Creamy Mintの判定 */

    const isMint =
        selected === "mint";


    /* ライトテーマの判定 */

    const isLight =

        !isMint &&
        relativeLuminance(card) > 0.4;


    /* 文字色 */

    let text = isLight

        ? "#30352F"

        : "#EDE9E3";


    if (selected === "strawberry") {

        text = "#65414A";

    }


    if (selected === "tropical") {

        text = "#39452F";

    }


    if (selected === "ocean") {

        text = "#ECF1FA";

    }


    if (selected === "christmas") {

        text = "#F2FCFD";

    }


    if (isMint) {

        text = "#F1E8DE";

    }


    const muted = mixColors(
        text,
        card,
        0.18
    );


    /* メイン背景 */

    const background = base;


    /* カード背景 */

    const surface = card;


    /* サイドバー */

    let sidebar = isLight

        ? mixColors(base, card, 0.4)

        : darkenColor(base, 0.12);


    if (isMint) {

        sidebar = "#503C34";

    }


    /* カードのホバー */

    const surfaceHover = isLight

        ? darkenColor(surface, 0.04)

        : lightenColor(surface, 0.06);


    /* 入力欄 */

    let inputBackground = isLight

        ? mixColors(card, base, 0.45)

        : darkenColor(surface, 0.12);


    if (isMint) {

        inputBackground = "#362925";

    }


    /* ヘッダー */

    let header = sidebar;


    if (selected === "christmas") {

        header = "#783346";

    }


    if (selected === "strawberry") {

        header = "#FFFAF5";

    }


    if (selected === "tropical") {

        header = "#F7F8EF";

    }


    if (isMint) {

        header = "#362925";

    }


    /* ボタン */

    let buttonColor = accent;


    if (isMint) {

        buttonColor = "#92D6BC";

    }


    let buttonHover = mixColors(

        buttonColor,

        surface,

        0.15

    );


    if (isMint) {

        buttonHover = "#A7DFC9";

    }


    /* ボタンの文字色 */

    const primaryText = isMint

        ? "#362925"

        : readableText(buttonColor);


    const primaryHoverText = isMint

        ? "#362925"

        : readableText(buttonHover);


    /* 実際に画面で使用するアクセント */

    const displayAccent = isMint

        ? "#92D6BC"

        : accent;


    /* 装飾色の文字色 */

    const decorationText =
        readableText(decoration);


    /* 見出し用の差し色 */

    const accentHeading =
        ensureContrast(

            displayAccent,

            surface

        );


    const decorationHeading =
        ensureContrast(

            decoration,

            surface

        );


    /* メイン背景上の文字 */

    const pageText = isMint

        ? "#362925"

        : ensureContrast(text, background);


    const pageMuted = isMint

        ? "#503C34"

        : ensureContrast(muted, background);


    /* 枠線 */

    const border = isLight

        ? darkenColor(surface, 0.12)

        : lightenColor(surface, 0.14);


    /* 削除・減点ボタン */

    const dangerBackground = isLight

        ? mixColors(
            surface,
            "#C77D7D",
            0.18
        )

        : mixColors(
            surface,
            "#805050",
            0.25
        );


    /* クマの色 */

    let bearColor = decoration;


    if (selected === "strawberry") {

        bearColor = "#65414A";

    }


    if (selected === "tropical") {

        bearColor = "#39452F";

    }


    if (selected === "christmas") {

        bearColor = "#DAF0F2";

    }


    if (selected === "ocean") {

        bearColor = "#C9D9F5";

    }


    if (isMint) {

        bearColor = "#DCC2AA";

    }


    /* 最高得点カード */

    let highlight = decoration;


    if (isMint) {

        highlight = "#DCC2AA";

    }


    if (selected === "ocean") {

        highlight = accent;

    }


    const highlightText = isMint

        ? "#362925"

        : readableText(highlight);


    /* CSS変数 */

    const vars = {

        "--background": background,

        "--surface": surface,

        "--surface-hover": surfaceHover,

        "--sidebar-bg": sidebar,

        "--header-bg": header,

        "--input-bg": inputBackground,


        "--text": ensureContrast(
            text,
            surface
        ),

        "--text-sub": ensureContrast(
            muted,
            surface
        ),

        "--page-text": pageText,

        "--page-muted": pageMuted,

        "--border": border,


        "--primary": buttonColor,

        "--primary-hover": buttonHover,

        "--primary-text": primaryText,

        "--primary-hover-text":
            primaryHoverText,

        "--primary-light": surfaceHover,


        "--accent": displayAccent,

        "--accent-text": primaryText,

        "--accent-heading": accentHeading,


        "--decoration": decoration,

        "--decoration-text": decorationText,

        "--decoration-heading":
            decorationHeading,


        "--highlight": highlight,

        "--highlight-text": highlightText,


        "--danger": isLight

            ? "#963E48"

            : "#D6A3A3",


        "--danger-bg": dangerBackground,


        "--gold": isLight

            ? "#82651F"

            : "#D4BC8B",


        "--silver": isLight

            ? "#626C75"

            : "#BCC4C8",


        "--bronze": isLight

            ? "#925D42"

            : "#BD9B83",


        "--bear-color": bearColor,


        "--gradient-start": base,

        "--gradient-middle": card,

        "--gradient-end": decoration,


        "--mint-cream": "#BCE4D3",

        "--mint-fresh": "#92D6BC",

        "--mint-chocolate": "#503C34",

        "--mint-dark-chocolate": "#362925",

        "--mint-beige": "#DCC2AA",

        "--mint-flake-opacity": "0.45"

    };


    /* CSSに反映 */

    Object.entries(vars).forEach(
        ([name, value]) => {

            root.style.setProperty(
                name,
                value
            );

        }
    );


    /* 現在のテーマ */

    root.dataset.theme = selected;


    root.dataset.scheme =

        isLight

            ? "light"

            : "dark";


    root.style.colorScheme =

        isLight

            ? "light"

            : "dark";


    /* クマの表示切り替え */

    document.body.classList.toggle(

        "hide-bear",

        !themeSettings.showBear

    );


    /* 結果プレビューを更新 */

    if (
        typeof renderResultPreview === "function" &&
        document.getElementById("result-preview")
    ) {

        renderResultPreview();

    }

}


/* 11. テーマ設定画面の作成
========================================= */

function createThemePanel() {

    if (
        document.querySelector(
            ".appearance-panel"
        )
    ) {

        return;

    }


    const settings =
        document.getElementById("settings");

    if (!settings) return;


    const panel =
        document.createElement("div");

    panel.className =
        "panel appearance-panel";


    panel.innerHTML = `

        <div class="appearance-heading">

            <div class="section-eyebrow">
                APPEARANCE
            </div>

            <h2>
                カラーテーマ
            </h2>

            <p>
                好きな配色でアプリを使用できます。
                設定はこのブラウザに保存されます。
            </p>

        </div>


        <div

            id="theme-options"

            class="theme-options"

        ></div>


        <div class="custom-theme-section">

            <h3>
                カスタムカラー
            </h3>

            <p>
                好きな4色を組み合わせて、
                オリジナルテーマを作成できます。
            </p>


            <div class="custom-color-grid">

                ${[

                    "背景カラー",

                    "カードカラー",

                    "アクセントカラー",

                    "装飾カラー"

                ].map((label, index) => `

                    <label class="custom-color-item">

                        <span>
                            ${label}
                        </span>

                        <input

                            type="color"

                            id="custom-color-${index}"

                            value="${themeSettings.custom[index]}"

                        >

                        <span

                            id="custom-hex-${index}"

                            class="color-code"

                        >
                            ${themeSettings.custom[index]}
                        </span>

                    </label>

                `).join("")}

            </div>


            <button

                type="button"

                id="apply-custom-theme"

                class="primary-btn"

            >
                カスタムテーマを適用
            </button>


            <p

                id="custom-theme-status"

                style="margin-top:12px"

            ></p>

        </div>


        <div class="bear-setting">

            <div>

                <h3>
                    マスコット
                </h3>

                <p>
                    クマのイラストを表示します。
                </p>

            </div>


            <label class="toggle-switch">

                <input

                    type="checkbox"

                    id="show-bear-setting"

                    aria-label="クマを表示する"

                    ${
                        themeSettings.showBear

                            ? "checked"

                            : ""
                    }

                >

                <span class="toggle-track">
                </span>

            </label>

        </div>


        <button

            type="button"

            id="reset-theme"

            class="secondary-btn"

        >
            初期テーマに戻す
        </button>

    `;


    settings.appendChild(panel);


    renderThemeOptions();

}


/* 12. テーマカードの表示
========================================= */

function renderThemeOptions() {

    const container =
        document.getElementById(
            "theme-options"
        );

    if (!container) return;


    container.innerHTML =

        Object.entries(THEMES).map(

            ([id, theme]) => `

                <button

                    type="button"

                    class="theme-option
                        ${
                            themeSettings.selected === id

                                ? "selected"

                                : ""
                        }"

                    data-theme-id="${id}"

                    aria-pressed="${
                        themeSettings.selected === id
                    }"

                >

                    <div class="theme-swatches">

                        ${theme.colors.map(color => `

                            <div style="
                                background:${color};
                            "></div>

                        `).join("")}

                    </div>


                    <div class="theme-option-name">

                        ${theme.name}

                        ${
                            themeSettings.selected === id

                                ? `<span>
                                    選択中
                                   </span>`

                                : ""
                        }

                    </div>


                    <div class="theme-color-codes">

                        ${theme.colors.join(" / ")}

                    </div>

                </button>

            `

        ).join("");


    /* カスタムテーマの使用状態 */

    const customStatus =
        document.getElementById(
            "custom-theme-status"
        );


    if (customStatus) {

        customStatus.textContent =

            themeSettings.selected === "custom"

                ? "カスタムテーマを使用中"

                : "";

    }


    /* テーマの切り替え */

    container.querySelectorAll(
        "[data-theme-id]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                themeSettings.selected =
                    button.dataset.themeId;

                saveThemeSettings();

                applyTheme();

                renderThemeOptions();

            }
        );

    });

}


/* 13. カスタムカラーの操作
========================================= */

function bindThemeEvents() {

    for (
        let index = 0;
        index < 4;
        index++
    ) {

        const input =
            document.getElementById(
                `custom-color-${index}`
            );

        if (!input) continue;


        input.addEventListener(
            "input",
            () => {

                const value =
                    input.value.toUpperCase();

                themeSettings.custom[index] =
                    value;


                document.getElementById(
                    `custom-hex-${index}`
                ).textContent = value;


                saveThemeSettings();


                if (
                    themeSettings.selected
                    === "custom"
                ) {

                    applyTheme();

                }

            }
        );

    }


    /* カスタムテーマの適用 */

    document.getElementById(
        "apply-custom-theme"
    )?.addEventListener(
        "click",
        () => {

            themeSettings.selected =
                "custom";

            saveThemeSettings();

            applyTheme();

            renderThemeOptions();

            themeToast(
                "カスタムテーマを適用しました"
            );

        }
    );


    /* クマの表示切り替え */

    document.getElementById(
        "show-bear-setting"
    )?.addEventListener(
        "change",
        event => {

            themeSettings.showBear =
                event.target.checked;

            saveThemeSettings();

            applyTheme();

        }
    );


    /* 初期テーマに戻す */

    document.getElementById(
        "reset-theme"
    )?.addEventListener(
        "click",
        () => {

            themeSettings =
                defaultThemeSettings();


            for (
                let index = 0;
                index < 4;
                index++
            ) {

                document.getElementById(
                    `custom-color-${index}`
                ).value =
                    themeSettings.custom[index];


                document.getElementById(
                    `custom-hex-${index}`
                ).textContent =
                    themeSettings.custom[index];

            }


            document.getElementById(
                "show-bear-setting"
            ).checked = true;


            saveThemeSettings();

            applyTheme();

            renderThemeOptions();

            themeToast(
                "初期テーマに戻しました"
            );

        }
    );

}


/* 14. 通知
========================================= */

function themeToast(message) {

    if (typeof showToast === "function") {

        showToast(message);

    }

}


/* 15. クマのイラスト
========================================= */

function createBearDecoration() {

    if (
        document.querySelector(
            ".sidebar-bear"
        )
    ) {

        return;

    }


    const footer =
        document.querySelector(
            ".sidebar-footer"
        );

    if (!footer) return;


    const bear =
        document.createElement("div");

    bear.className =
        "sidebar-bear";


    bear.innerHTML = `

        <img

            src="bear.png"

            alt=""

            class="bear-image"

            draggable="false"

        >


        <div class="bear-caption">

            LOVE ALL

        </div>

    `;


    footer.before(bear);

}


/* 16. 初期化
========================================= */

function initializeTheme() {

    applyTheme();

    createThemePanel();

    bindThemeEvents();

    createBearDecoration();

}


if (document.readyState === "loading") {

    document.addEventListener(

        "DOMContentLoaded",

        initializeTheme,

        { once: true }

    );

} else {

    initializeTheme();

}
/* =========================================
   REALISTIC CHOCOLATE FLAKES
========================================= */

function createChocolateFlakes() {

    const width = 480;
    const height = 480;

    const count = 120;

    // フレークの設定

    const size = 0.75;
    const opacity = 0.50;

    // 毎回同じ配置になる乱数

    let seed = 2026;

    function random() {

        seed = (
            Math.imul(seed, 1664525)
            + 1013904223
        ) >>> 0;

        return seed / 4294967296;

    }

    function range(min, max) {

        return min + random() * (max - min);

    }

    // 破片の種類と割合

    const types = [
    ...Array(18).fill("B"),
    ...Array(102).fill("D")
];

    // 種類をランダムに並べ替える

    for (let i = types.length - 1; i > 0; i--) {

        const j = Math.floor(
            random() * (i + 1)
        );

        [types[i], types[j]] =
            [types[j], types[i]];

    }

    const flakes = [];

    for (let i = 0; i < count; i++) {

        const x = range(0, width);
        const y = range(0, height);

        const rotation = range(0, 360);

        const scale =
            range(0.35, 1.25) * size;

        const length = range(10, 22);

        let shape = "";

        /* A：細長い削りチョコ */

        if (types[i] === "A") {

            shape = `

                <path
                    d="
                        M-2 1
                        Q4 -4 ${length} -3
                        L${length - 3} 1
                        L5 3
                        L0 5 Z
                    "
                    fill="url(#chocolate)"
                />

                <path
                    d="
                        M-2 1
                        Q4 -4 ${length} -3
                        L5 0
                        L0 3 Z
                    "
                    fill="#99745D"
                />

                <path
                    d="
                        M1 2
                        L5 0
                        L${length - 3} -1
                    "
                    fill="none"
                    stroke="#C19C82"
                    stroke-width=".55"
                />

            `;

        }

        /* B：厚みのある砕いたチョコ */

        if (types[i] === "B") {

            shape = `

                <path
                    d="
                        M-3 2
                        L0 -4
                        L6 -6
                        L${length * 0.7} -1
                        L10 5
                        L3 8
                        L-2 6 Z
                    "
                    fill="#281912"
                />

                <path
                    d="
                        M-3 2
                        L0 -4
                        L6 -6
                        L${length * 0.7} -1
                        L6 3
                        L0 4 Z
                    "
                    fill="url(#chocolate)"
                />

                <path
                    d="M-3 2 L0 4 L3 8 L-2 6 Z"
                    fill="#755340"
                />

                <path
                    d="M0 -4 L6 -6 L10 -3"
                    fill="none"
                    stroke="#B38C72"
                    stroke-width=".7"
                />

                <path
                    d="M1 -2 L4 -1 L3 2"
                    fill="none"
                    stroke="#342019"
                    stroke-width=".6"
                />

            `;

        }

        /* C：薄く割れたチョコ */

        if (types[i] === "C") {

            shape = `

                <path
                    d="
                        M-4 0
                        L2 -5
                        L${length} -4
                        L12 0
                        L6 3
                        L-2 5 Z
                    "
                    fill="#39251D"
                />

                <path
                    d="
                        M-4 0
                        L2 -5
                        L${length} -4
                        L6 1
                        L-2 3 Z
                    "
                    fill="url(#chocolate)"
                />

                <path
                    d="
                        M2 -5
                        L${length} -4
                        L6 1
                    "
                    fill="none"
                    stroke="#B18C73"
                    stroke-width=".55"
                />

            `;

        }
        /* D：細かいチョコ粒 */

if (types[i] === "D") {

    const w = range(2, 7);
    const h = range(2, 5);

    shape = `

        <path
            d="
                M0 0
                L${w * 0.45} -1
                L${w} ${h * 0.3}
                L${w * 0.65} ${h}
                L-1 ${h * 0.6}
                Z
            "
            fill="url(#chocolate)"
        />

        <path
            d="
                M0 0
                L${w * 0.45} -1
                L${w} ${h * 0.3}
            "
            fill="none"
            stroke="#99745D"
            stroke-width=".5"
        />

    `;

}

        // 端の破片も自然につながるようにする

        const offsetsX = [0];
        const offsetsY = [0];

        if (x < 25) offsetsX.push(width);
        if (x > width - 25) offsetsX.push(-width);

        if (y < 25) offsetsY.push(height);
        if (y > height - 25) offsetsY.push(-height);

        for (const dx of offsetsX) {

            for (const dy of offsetsY) {

                flakes.push(`

                    <g transform="
                        translate(${x + dx} ${y + dy})
                        rotate(${rotation})
                        scale(${scale})
                    ">

                        ${shape}

                    </g>

                `);

            }

        }

    }

    const svg = `

        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
        >

            <defs>

                <linearGradient
                    id="chocolate"
                    x1="0"
                    y1="0"
                    x2=".8"
                    y2="1"
                >

                    <stop
                        offset="0%"
                        stop-color="#94705B"
                    />

                    <stop
                        offset="25%"
                        stop-color="#654538"
                    />

                    <stop
                        offset="60%"
                        stop-color="#50352B"
                    />

                    <stop
                        offset="100%"
                        stop-color="#281912"
                    />

                </linearGradient>

            </defs>

            <g opacity="${opacity}">

                ${flakes.join("")}

            </g>

        </svg>

    `;

    const image =
        `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    document.documentElement.style.setProperty(
        "--mint-flakes",
        image
    );

}

createChocolateFlakes();