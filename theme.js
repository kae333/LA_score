
/* ========================================
   PARTY SCORE
   THEME SYSTEM - ACCENT DESIGN
======================================== */


/* 01. プリセットテーマ
======================================== */

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
        name: "Classic Choco Mint",
        colors: [
            "#362925",
            "#503C34",
            "#92D6BC",
            "#C59B7B"
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

    const [base, card, accent, decoration] =
        getThemeColors();

    const root = document.documentElement;
    const selected = themeSettings.selected;

    // ライトテーマの判定

    const isLight =
        relativeLuminance(base) > 0.4;

    // テーマ別の文字色

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

    const muted = mixColors(
        text,
        base,
        0.18
    );

    // 文字のコントラストを確保

    function ensureContrast(color, background) {

        let result = color;

        const target =
            relativeLuminance(background) > 0.4
                ? "#000000"
                : "#FFFFFF";

        for (let i = 0; i < 60; i++) {

            if (
                contrastRatio(
                    result,
                    background
                ) >= 4.5
            ) {
                return result;
            }

            result = mixColors(
                result,
                target,
                0.06
            );

        }

        return result;

    }

    // 背景とカード

    const background = base;
    const surface = card;

    const sidebar = isLight
        ? mixColors(base, card, 0.4)
        : darkenColor(base, 0.12);

    const surfaceHover = isLight
        ? darkenColor(card, 0.04)
        : lightenColor(card, 0.06);

    const inputBackground = isLight
        ? mixColors(card, base, 0.45)
        : darkenColor(card, 0.12);

    // ヘッダー

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

    // ボタン

    const buttonColor = accent;

    const buttonHover = mixColors(
        accent,
        surface,
        0.15
    );

    const primaryText = ensureContrast(
        readableText(buttonColor),
        buttonColor
    );

    const primaryHoverText = ensureContrast(
        readableText(buttonHover),
        buttonHover
    );

    // 装飾色と見出し

    const decorationText = ensureContrast(
        readableText(decoration),
        decoration
    );

    const accentHeading = ensureContrast(
        accent,
        surface
    );

    const decorationHeading = ensureContrast(
        decoration,
        surface
    );

    // 枠線

    const border = isLight
        ? darkenColor(surface, 0.12)
        : lightenColor(surface, 0.14);

    // 削除・減点ボタン

    const dangerBackground = isLight
        ? mixColors(surface, "#C77D7D", 0.18)
        : mixColors(surface, "#805050", 0.25);

    // クマの色

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

    // 最高得点カード

    let highlight = decoration;

    if (selected === "mint") {
        highlight = accent;
    }

    if (selected === "ocean") {
        highlight = accent;
    }

    const highlightText =
        readableText(highlight);

    // CSS変数

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

        "--border": border,

        "--primary": buttonColor,
        "--primary-hover": buttonHover,
        "--primary-text": primaryText,

        "--primary-hover-text":
            primaryHoverText,

        "--primary-light": surfaceHover,

        "--accent": accent,
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
        "--gradient-end": decoration

    };

    // CSSに反映

    Object.entries(vars).forEach(
        ([name, value]) => {

            root.style.setProperty(
                name,
                value
            );

        }
    );

    // テーマ情報

    root.dataset.theme = selected;

    root.dataset.scheme =
        isLight ? "light" : "dark";

    root.style.colorScheme =
        isLight ? "light" : "dark";

    // クマの表示切り替え

    document.body.classList.toggle(
        "hide-bear",
        !themeSettings.showBear
    );

    // 現在の配色で結果プレビューを更新

    if (
        typeof renderResultPreview === "function" &&
        document.getElementById("result-preview")
    ) {
        renderResultPreview();
    }

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
