
/* ========================================
   PARTY SCORE
   THEME SYSTEM - ACCENT DESIGN
======================================== */


/* 01. プリセットテーマ
======================================== */

const THEMES = {

    sunset: {
        name: "Sunset Soda",
        colors: [
            "#39333F",
            "#49414F",
            "#8D79AA",
            "#F4BF83"
        ]
    },

    strawberry: {
        name: "Strawberry Noël",
        colors: [
            "#392429",
            "#4C3037",
            "#B96B7C",
            "#E4C69F"
        ]
    },

    tropical: {
        name: "Tropical Splash",
        colors: [
            "#233B45",
            "#2F4A56",
            "#719EAC",
            "#DCC580"
        ]
    },

    mint: {
        name: "Mint Chocolate",
        colors: [
            "#382E2D",
            "#493B38",
            "#9FC5B5",
            "#D4B59E"
        ]
    },

    ocean: {
        name: "Ocean Float",
        colors: [
            "#293B46",
            "#354C59",
            "#86AEBF",
            "#E1BEA6"
        ]
    },

    christmas: {
        name: "Christmas Ribbon",
        colors: [
            "#263A30",
            "#30463A",
            "#D0BC98",
            "#B7AD8F"
        ]
    }

};

const THEME_STORAGE_KEY = "party-score-theme-v1";


/* 02. 初期設定
======================================== */

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
======================================== */

function validColor(color) {

    return (
        typeof color === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(color)
    );

}


/* 04. テーマ設定の読み込み
======================================== */

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
======================================== */

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
======================================== */

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
======================================== */

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
======================================== */

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


/* 背景色の調整 */

function readableBackground(
    color,
    text = "#EDE9E3"
) {

    let result = color;

    for (let i = 0; i < 60; i++) {

        if (
            contrastRatio(result, text) >= 4.5
        ) {

            return result;

        }

        result = darkenColor(
            result,
            0.05
        );

    }

    return result;

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


/* 暗い背景上に表示する差し色 */

function readableAccent(color, background) {

    let result = color;

    for (let i = 0; i < 60; i++) {

        if (
            contrastRatio(
                result,
                background
            ) >= 4.5
        ) {

            return result;

        }

        result = lightenColor(
            result,
            0.06
        );

    }

    return result;

}


/* 09. 選択中のカラーを取得
======================================== */

function getThemeColors() {

    if (
        themeSettings.selected === "custom"
    ) {

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
======================================== */

function applyTheme() {

    const [

        base,

        card,

        accent,

        decoration

    ] = getThemeColors();

    const root =
        document.documentElement;


    /* 柔らかい文字色 */

    const text = "#EDE9E3";

    const muted = "#D5D1CC";


    /* メイン背景 */

    const background =
        readableBackground(
            base,
            text
        );


    /* カード背景 */

    const surface =
        readableBackground(
            card,
            text
        );


    /* サイドバー */

    const sidebar =
        darkenColor(
            background,
            0.12
        );


    /* カードのホバー */

    const surfaceHover =
        readableBackground(

            lightenColor(
                surface,
                0.06
            ),

            text

        );


    /* 入力欄 */

    const inputBackground =
        darkenColor(
            surface,
            0.12
        );


    /* 差し色を活かしたボタン */

    const buttonColor =
        accent;

    const buttonHover =
        mixColors(
            accent,
            surface,
            0.15
        );


    /* ボタンの文字色 */

    const primaryText =
        readableText(buttonColor);

    const primaryHoverText =
        readableText(buttonHover);


    /* 装飾カラーの文字色 */

    const decorationText =
        readableText(decoration);


    /* 見出し用の差し色 */

    const accentHeading =
        readableAccent(
            accent,
            surface
        );

    const decorationHeading =
        readableAccent(
            decoration,
            surface
        );


    /* 枠線 */

    const border =
        lightenColor(
            surface,
            0.14
        );


    /* 減点・削除ボタン */

    const dangerBackground =
        mixColors(
            surface,
            "#805050",
            0.25
        );


    /* CSS変数 */

    const vars = {

        "--background": background,

        "--surface": surface,

        "--surface-hover": surfaceHover,

        "--sidebar-bg": sidebar,

        "--header-bg": sidebar,

        "--input-bg": inputBackground,


        "--text": text,

        "--text-sub": muted,

        "--border": border,


        "--primary": buttonColor,

        "--primary-hover": buttonHover,

        "--primary-text": primaryText,

        "--primary-hover-text":
            primaryHoverText,

        "--primary-light": surfaceHover,


        "--accent": accent,

        "--accent-text":
            readableText(accent),

        "--accent-heading":
            accentHeading,


        "--decoration": decoration,

        "--decoration-text":
            decorationText,

        "--decoration-heading":
            decorationHeading,


        "--danger": "#D6A3A3",

        "--danger-bg":
            dangerBackground,


        "--gold": "#D4BC8B",

        "--silver": "#BCC4C8",

        "--bronze": "#BD9B83",


        "--bear-color": decoration,


        "--gradient-start": base,

        "--gradient-middle": card,

        "--gradient-end": decoration

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

    root.dataset.theme =
        themeSettings.selected;


    /* クマの表示切り替え */

    document.body.classList.toggle(

        "hide-bear",

        !themeSettings.showBear

    );

}


/* 11. テーマ設定画面の作成
======================================== */

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
======================================== */

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
======================================== */

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
======================================== */

function themeToast(message) {

    if (typeof showToast === "function") {

        showToast(message);

    }

}


/* 15. クマのイラスト
======================================== */

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
======================================== */

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
