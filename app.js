
/* =========================
   1. 基本設定・データ保存
========================= */

const STORAGE_KEY = "party-score-v1";

const $ = id => document.getElementById(id);

function createId() {
    return Date.now().toString(36)
        + Math.random().toString(36).slice(2, 10);
}

function createInitialData() {
    return {
        eventName: "Christmas Party 2026",
        eventDate: "2026-12-05",
        teams: [],
        games: []
    };
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved
            ? JSON.parse(saved)
            : createInitialData();

    } catch {
        return createInitialData();
    }
}

let state = loadData();

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

        $("save-status").textContent = "自動保存済み";

    } catch {
        $("save-status").textContent = "保存失敗";
        showToast("データを保存できませんでした");
    }
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function formatScore(value) {
    return number(value).toLocaleString("ja-JP", {
        maximumFractionDigits: 3
    });
}

let toastTimer;

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}


/* =========================
   2. メニュー切り替え
========================= */

document.querySelectorAll(".nav-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));

        document.querySelectorAll(".page")
            .forEach(p => p.classList.remove("active"));

        btn.classList.add("active");

        $(btn.dataset.page).classList.add("active");

        renderAll();

        window.scrollTo(0, 0);

    });

});


/* =========================
   3. 得点・順位の計算
========================= */

function getSubgameScore(subgame, teamId) {

    const value = number(subgame.scores[teamId]);

    switch (subgame.mode) {

        case "correct":
            return value === 1
                ? number(subgame.points)
                : 0;

        case "count":
            return value * number(subgame.points);

        case "rank":
            return value > 0
                ? number(subgame.rankPoints[value - 1])
                : 0;

        default:
            return value;
    }
}

function getGameScore(game, teamId) {

    return game.subgames.reduce((total, subgame) => {
        return total + getSubgameScore(subgame, teamId);
    }, 0);

}

function getTotalScore(teamId) {

    return state.games.reduce((total, game) => {
        return total + getGameScore(game, teamId);
    }, 0);

}

function getRankings(game = null) {

    const rankings = state.teams.map(team => ({

        id: team.id,
        name: team.name,

        score: game
            ? getGameScore(game, team.id)
            : getTotalScore(team.id)

    }));

    rankings.sort((a, b) => b.score - a.score);

    rankings.forEach((team, index) => {

        if (
            index > 0 &&
            team.score === rankings[index - 1].score
        ) {

            team.rank = rankings[index - 1].rank;

        } else {

            team.rank = index + 1;

        }

    });

    return rankings;

}


/* =========================
   4. 班管理
========================= */

function addTeam() {

    const input = $("new-team-name");
    const name = input.value.trim();

    if (!name) {
        showToast("班名を入力してください");
        return;
    }

    if (state.teams.some(team => team.name === name)) {
        showToast("同じ名前の班が存在します");
        return;
    }

    const team = {
        id: createId(),
        name: name
    };

    state.teams.push(team);

    state.games.forEach(game => {

        game.subgames.forEach(subgame => {
            subgame.scores[team.id] = 0;
        });

    });

    input.value = "";

    saveData();
    renderAll();

    showToast(`${name}を追加しました`);

}

function deleteTeam(teamId) {

    const team = state.teams.find(t => t.id === teamId);

    if (!team) return;

    if (!confirm(
        `${team.name}と、この班の全得点を削除しますか？`
    )) return;

    state.teams = state.teams.filter(t => t.id !== teamId);

    state.games.forEach(game => {

        game.subgames.forEach(subgame => {
            delete subgame.scores[teamId];
        });

    });

    saveData();
    renderAll();

    showToast("班を削除しました");

}

function renderTeams() {

    const container = $("team-list");

    if (state.teams.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                班が登録されていません
            </div>
        `;

        return;
    }

    container.innerHTML = state.teams.map((team, index) => `

        <div class="team-row">

            <span class="team-index">
                ${index + 1}
            </span>

            <input
                type="text"
                value="${escapeHTML(team.name)}"
                data-action="team-name"
                data-team="${team.id}"
            >

            <span class="team-total">
                ${formatScore(getTotalScore(team.id))} pt
            </span>

            <button
                class="delete-btn"
                data-action="delete-team"
                data-team="${team.id}"
            >
                削除
            </button>

        </div>

    `).join("");

}

$("add-team").addEventListener("click", addTeam);

$("new-team-name").addEventListener("keydown", e => {

    if (e.key === "Enter") addTeam();

});


/* =========================
   5. ゲーム・小ゲーム管理
========================= */

function createSubgame(name = "得点") {

    const scores = {};

    state.teams.forEach(team => {
        scores[team.id] = 0;
    });

    return {

        id: createId(),
        name: name,

        mode: "manual",

        points: 10,

        rankPoints: [50, 40, 30, 20, 10, 5],

        scores: scores

    };

}

function addGame() {

    const input = $("new-game-name");
    const name = input.value.trim();

    if (!name) {
        showToast("ゲーム名を入力してください");
        return;
    }

    state.games.push({

        id: createId(),
        name: name,

        subgames: [
            createSubgame("得点")
        ]

    });

    input.value = "";

    saveData();
    renderAll();

    showToast("ゲームを追加しました");

}

function deleteGame(gameId) {

    const game = state.games.find(g => g.id === gameId);

    if (!game) return;

    if (!confirm(
        `${game.name}と、その得点をすべて削除しますか？`
    )) return;

    state.games = state.games.filter(g => g.id !== gameId);

    saveData();
    renderAll();

    showToast("ゲームを削除しました");

}

function addSubgame(gameId) {

    const game = state.games.find(g => g.id === gameId);

    if (!game) return;

    game.subgames.push(
        createSubgame(`小ゲーム${game.subgames.length + 1}`)
    );

    saveData();
    renderAll();

    showToast("小ゲームを追加しました");

}

function deleteSubgame(gameId, subgameId) {

    const game = state.games.find(g => g.id === gameId);

    if (!game) return;

    if (!confirm("この小ゲームと得点を削除しますか？")) {
        return;
    }

    game.subgames = game.subgames.filter(
        s => s.id !== subgameId
    );

    saveData();
    renderAll();

    showToast("小ゲームを削除しました");

}

function moveGame(gameId, direction) {

    const index = state.games.findIndex(g => g.id === gameId);

    if (index < 0) return;

    const next = index + direction;

    if (next < 0 || next >= state.games.length) return;

    [state.games[index], state.games[next]] =
    [state.games[next], state.games[index]];

    saveData();
    renderAll();

}

$("add-game").addEventListener("click", addGame);

$("new-game-name").addEventListener("keydown", e => {

    if (e.key === "Enter") addGame();

});


/* =========================
   6. ゲーム管理画面の描画
========================= */

function renderGames() {

    const container = $("game-list");

    if (state.games.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                ゲームを追加してください
            </div>
        `;

        return;
    }

    container.innerHTML = state.games.map((game, index) => `

        <div class="game-card">

            <div class="game-header">

                <span>GAME ${index + 1}</span>

                <input
                    type="text"
                    value="${escapeHTML(game.name)}"
                    data-action="game-name"
                    data-game="${game.id}"
                >

                <button
                    class="small-btn"
                    data-action="move-game-up"
                    data-game="${game.id}"
                    ${index === 0 ? "disabled" : ""}
                >
                    ↑
                </button>

                <button
                    class="small-btn"
                    data-action="move-game-down"
                    data-game="${game.id}"
                    ${index === state.games.length - 1
                        ? "disabled" : ""}
                >
                    ↓
                </button>

                <button
                    class="delete-btn"
                    data-action="delete-game"
                    data-game="${game.id}"
                >
                    削除
                </button>

            </div>

            <div class="game-body">

                ${game.subgames.map(subgame =>
                    renderSubgame(game, subgame)
                ).join("")}

                <div class="game-actions">

                    <button
                        class="secondary-btn"
                        data-action="add-subgame"
                        data-game="${game.id}"
                    >
                        ＋ 小ゲームを追加
                    </button>

                </div>

                <div class="game-total">

                    ゲーム内順位

                    <div data-game-summary="${game.id}">
                        ${renderGameRanking(game)}
                    </div>

                </div>

            </div>

        </div>

    `).join("");

}

function renderGameRanking(game) {

    if (!state.teams.length) {
        return "班が登録されていません";
    }

    return getRankings(game).map(team => `

        <div style="
            display:flex;
            justify-content:space-between;
            padding:6px 0;
            gap:10px;
        ">

            <span>
                ${team.rank}位　
                ${escapeHTML(team.name)}
            </span>

            <strong>
                ${formatScore(team.score)} pt
            </strong>

        </div>

    `).join("");

}


/* =========================
   7. 小ゲーム・配点設定
========================= */

function renderSubgame(game, subgame) {

    const attrs = `
        data-game="${game.id}"
        data-subgame="${subgame.id}"
    `;

    return `

        <div class="subgame-card">

            <div class="subgame-header">

                <input
                    type="text"
                    value="${escapeHTML(subgame.name)}"
                    data-action="subgame-name"
                    ${attrs}
                >

                <button
                    class="delete-btn"
                    data-action="delete-subgame"
                    ${attrs}
                >
                    削除
                </button>

            </div>

            <div class="point-settings">

                <label>配点方式</label>

                <select
                    data-action="score-mode"
                    ${attrs}
                >

                    ${[
                        ["manual", "自由入力"],
                        ["correct", "正解・不正解"],
                        ["count", "回数 × 得点"],
                        ["rank", "順位別配点"]
                    ].map(([value, label]) => `

                        <option
                            value="${value}"
                            ${subgame.mode === value
                                ? "selected" : ""}
                        >
                            ${label}
                        </option>

                    `).join("")}

                </select>

                ${subgame.mode !== "rank" ? `

                    <label>
                        ${subgame.mode === "manual"
                            ? "加減点の単位"
                            : subgame.mode === "correct"
                            ? "正解時の得点"
                            : "1回あたりの得点"}
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="any"
                        value="${subgame.points}"
                        data-action="point-value"
                        ${attrs}
                    >

                    <span>pt</span>

                ` : `

                    <div style="width:100%">

                        ${renderRankSettings(game, subgame)}

                    </div>

                `}

            </div>

            <div>

                ${state.teams.length
                    ? state.teams.map(team =>
                        renderScoreInput(game, subgame, team)
                    ).join("")
                    : `<div class="empty-state">
                        班を先に登録してください
                       </div>`}

            </div>

        </div>

    `;

}

function renderRankSettings(game, subgame) {

    const count = state.teams.length;

    return Array.from({ length: count }, (_, index) => `

        <div style="
            display:inline-flex;
            align-items:center;
            gap:5px;
            margin:5px 10px 5px 0;
        ">

            <label>${index + 1}位</label>

            <input
                type="number"
                step="any"
                value="${number(subgame.rankPoints[index])}"
                data-action="rank-point"
                data-game="${game.id}"
                data-subgame="${subgame.id}"
                data-rank="${index}"
            >

            <span>pt</span>

        </div>

    `).join("");

}


/* =========================
   8. 班ごとの得点入力欄
========================= */

function renderScoreInput(game, subgame, team) {

    const value = number(subgame.scores[team.id]);

    const attrs = `
        data-game="${game.id}"
        data-subgame="${subgame.id}"
        data-team="${team.id}"
    `;

    let controls = "";

    if (subgame.mode === "correct") {

        controls = `

            <select data-action="score-value" ${attrs}>

                <option value="0"
                    ${value === 0 ? "selected" : ""}>
                    未正解
                </option>

                <option value="1"
                    ${value === 1 ? "selected" : ""}>
                    正解
                </option>

            </select>

        `;

    } else if (subgame.mode === "rank") {

        controls = `

            <select data-action="score-value" ${attrs}>

                <option value="0">未設定</option>

                ${state.teams.map((_, index) => `

                    <option
                        value="${index + 1}"
                        ${value === index + 1
                            ? "selected" : ""}
                    >
                        ${index + 1}位
                    </option>

                `).join("")}

            </select>

        `;

    } else {

        controls = `

            <button
                class="point-btn minus"
                data-action="minus-score"
                ${attrs}
            >
                −
            </button>

            <input
                type="number"
                step="${subgame.mode === "count" ? "1" : "any"}"
                ${subgame.mode === "count" ? 'min="0"' : ""}
                value="${value}"
                data-action="score-value"
                ${attrs}
            >

            <button
                class="point-btn"
                data-action="plus-score"
                ${attrs}
            >
                ＋
            </button>

        `;

    }

    return `

        <div class="score-input-row">

            <div class="score-team-name">
                ${escapeHTML(team.name)}
            </div>

            <div class="score-controls">

                ${controls}

            </div>

            <strong
                data-score-display="${subgame.id}-${team.id}"
                style="
                    min-width:65px;
                    text-align:right;
                    color:#245740;
                "
            >
                ${formatScore(
                    getSubgameScore(subgame, team.id)
                )} pt
            </strong>

        </div>

    `;

}


/* =========================
   9. 操作イベント
========================= */

document.addEventListener("click", e => {

    const button = e.target.closest("button[data-action]");

    if (!button) return;

    const {
        action,
        team: teamId,
        game: gameId,
        subgame: subgameId
    } = button.dataset;

    const game = state.games.find(g => g.id === gameId);

    const subgame = game?.subgames.find(
        s => s.id === subgameId
    );

    switch (action) {

        case "delete-team":
            deleteTeam(teamId);
            break;

        case "delete-game":
            deleteGame(gameId);
            break;

        case "add-subgame":
            addSubgame(gameId);
            break;

        case "delete-subgame":
            deleteSubgame(gameId, subgameId);
            break;

        case "move-game-up":
            moveGame(gameId, -1);
            break;

        case "move-game-down":
            moveGame(gameId, 1);
            break;

        case "plus-score":
        case "minus-score":

            if (!subgame) return;

            const step = subgame.mode === "count"
                ? 1
                : number(subgame.points);

            const direction = action === "plus-score"
                ? 1
                : -1;

            let nextValue =
                number(subgame.scores[teamId])
                + step * direction;

            if (subgame.mode === "count") {
                nextValue = Math.max(0, nextValue);
            }

            subgame.scores[teamId] = nextValue;

            button.parentElement
                .querySelector("input").value = nextValue;

            saveData();
            refreshScores();

            break;

    }

});


/* =========================
   10. 入力値の変更
========================= */

document.addEventListener("input", e => {

    const input = e.target;

    if (!input.dataset.action) return;

    // セレクト欄はchangeイベントで処理
    if (input.tagName === "SELECT") return;

    updateInput(input);

});

document.addEventListener("change", e => {

    const input = e.target;

    if (!input.dataset.action) return;

    if (input.tagName === "SELECT") {

        updateInput(input);

    } else if (input.value.trim() === "") {

        // 空欄の場合は保存済みの値に戻す
        renderAll();

    }

});

function updateInput(input) {

    const {
        action,
        team: teamId,
        game: gameId,
        subgame: subgameId,
        rank
    } = input.dataset;

    const team = state.teams.find(t => t.id === teamId);

    const game = state.games.find(g => g.id === gameId);

    const subgame = game?.subgames.find(
        s => s.id === subgameId
    );

    switch (action) {

        case "team-name":

            if (!team || !input.value.trim()) return;

            team.name = input.value.trim();

            break;

        case "game-name":

            if (!game || !input.value.trim()) return;

            game.name = input.value.trim();

            break;

        case "subgame-name":

            if (!subgame || !input.value.trim()) return;

            subgame.name = input.value.trim();

            break;

        case "score-mode":

            if (!subgame) return;

            if (subgame.mode === input.value) return;

            const hasScores = Object.values(
                subgame.scores
            ).some(value => number(value) !== 0);

            if (
                hasScores &&
                !confirm(
                    "配点方式を変更すると、"
                    + "この小ゲームの入力済み得点が"
                    + "リセットされます。変更しますか？"
                )
            ) {

                input.value = subgame.mode;
                return;

            }

            subgame.mode = input.value;

            state.teams.forEach(team => {
                subgame.scores[team.id] = 0;
            });

            saveData();
            renderAll();

            return;

        case "point-value":

            if (!subgame) return;

            subgame.points = Math.max(
                0,
                number(input.value)
            );

            break;

        case "rank-point":

            if (!subgame) return;

            subgame.rankPoints[Number(rank)] =
                number(input.value);

            break;

        case "score-value":

            if (!subgame) return;

            let value = number(input.value);

            if (subgame.mode === "count") {

                value = Math.max(0, Math.floor(value));

            }

            subgame.scores[teamId] = value;

            if (subgame.mode === "count") {
                input.value = value;
            }

            break;

        default:
            return;

    }

    saveData();
    refreshScores();

}


/* =========================
   11. ダッシュボード
========================= */

function renderDashboard() {

    const rankings = getRankings();

    $("team-count").textContent = state.teams.length;

    $("game-count").textContent = state.games.length;

    $("highest-score").textContent = rankings.length
        ? formatScore(rankings[0].score)
        : "0";

    const maxScore = Math.max(
        1,
        ...rankings.map(team => team.score)
    );

    $("ranking-list").innerHTML = rankings.length

        ? rankings.map(team => {

            const width = Math.max(
                0,
                team.score / maxScore * 100
            );

            return `

                <div class="ranking-row
                    ${team.rank === 1 ? "first" : ""}">

                    <div class="rank-number rank-${team.rank}">
                        ${team.rank}
                    </div>

                    <div class="rank-team">
                        ${escapeHTML(team.name)}
                    </div>

                    <div class="rank-bar">

                        <div
                            class="rank-bar-fill"
                            style="width:${width}%"
                        ></div>

                    </div>

                    <div class="rank-score">
                        ${formatScore(team.score)}
                        <span>pt</span>
                    </div>

                </div>

            `;

        }).join("")

        : `<div class="empty-state">
            班管理から班を登録してください
           </div>`;

    $("game-summary").innerHTML = state.games.length

        ? state.games.map(game => `

            <div style="
                margin-bottom:16px;
                padding:16px;
                border:1px solid #e0e4e7;
                border-radius:8px;
            ">

                <h3 style="margin-bottom:10px">
                    ${escapeHTML(game.name)}
                </h3>

                ${renderGameRanking(game)}

            </div>

        `).join("")

        : `<div class="empty-state">
            ゲームが登録されていません
           </div>`;

}


/* =========================
   12. 全ゲームの得点一覧
========================= */

function renderScoreTable() {

    const rankings = getRankings();

    const showSubgames = $("show-subgames").checked;

    const sort = $("score-sort").value;

    const teams = sort === "rank"

        ? rankings.map(r =>
            state.teams.find(t => t.id === r.id)
        )

        : state.teams;

    let headers = "<th>班名</th>";

    state.games.forEach(game => {

        headers += `
            <th>${escapeHTML(game.name)}</th>
        `;

        if (showSubgames) {

            game.subgames.forEach(subgame => {

                headers += `
                    <th class="subgame-column">
                        ${escapeHTML(game.name)}
                        /
                        ${escapeHTML(subgame.name)}
                    </th>
                `;

            });

        }

    });

    headers += `
        <th>総合得点</th>
        <th>順位</th>
    `;

    const rows = teams.map(team => {

        let cells = `
            <td>${escapeHTML(team.name)}</td>
        `;

        state.games.forEach(game => {

            cells += `
                <td>
                    ${formatScore(
                        getGameScore(game, team.id)
                    )}
                </td>
            `;

            if (showSubgames) {

                game.subgames.forEach(subgame => {

                    cells += `
                        <td class="subgame-column">
                            ${formatScore(
                                getSubgameScore(subgame, team.id)
                            )}
                        </td>
                    `;

                });

            }

        });

        const rank = rankings.find(r => r.id === team.id);

        cells += `

            <td class="total-cell">
                ${formatScore(getTotalScore(team.id))}
            </td>

            <td class="rank-cell rank-${rank.rank}">
                ${rank.rank}位
            </td>

        `;

        return `<tr>${cells}</tr>`;

    }).join("");

    $("score-table").innerHTML = `

        <thead>
            <tr>${headers}</tr>
        </thead>

        <tbody>
            ${rows}
        </tbody>

    `;

}

$("score-sort").addEventListener(
    "change",
    renderScoreTable
);

$("show-subgames").addEventListener(
    "change",
    renderScoreTable
);


/* =========================
   13. イベント設定
========================= */

function renderSettings() {

    $("event-name").value = state.eventName;

    $("event-date").value = state.eventDate;

    $("event-title").textContent = state.eventName;

}

$("save-settings").addEventListener("click", () => {

    state.eventName = $("event-name").value.trim()
        || "Party Score";

    state.eventDate = $("event-date").value;

    saveData();
    renderAll();

    showToast("設定を保存しました");

});


/* =========================
   14. バックアップ・復元
========================= */

function downloadFile(content, filename, type) {

    const blob = new Blob([content], {
        type: type
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

}

$("backup-data").addEventListener("click", () => {

    downloadFile(
        JSON.stringify(state, null, 2),
        "party-score-backup.json",
        "application/json"
    );

});

$("restore-data").addEventListener("click", () => {

    $("restore-file").click();

});

function isValidBackup(data) {

    if (
        !data ||
        typeof data.eventName !== "string" ||
        typeof data.eventDate !== "string" ||
        !Array.isArray(data.teams) ||
        !Array.isArray(data.games)
    ) return false;

    const validId = id =>
        typeof id === "string" &&
        /^[a-zA-Z0-9_-]+$/.test(id);

    const validTeams = data.teams.every(team =>
        team &&
        validId(team.id) &&
        typeof team.name === "string"
    );

    const validGames = data.games.every(game =>
        game &&
        validId(game.id) &&
        typeof game.name === "string" &&
        Array.isArray(game.subgames) &&
        game.subgames.every(subgame =>
            subgame &&
            validId(subgame.id) &&
            typeof subgame.name === "string" &&
            ["manual", "correct", "count", "rank"]
                .includes(subgame.mode) &&
            Number.isFinite(subgame.points) &&
            Array.isArray(subgame.rankPoints) &&
            subgame.rankPoints.every(Number.isFinite) &&
            subgame.scores &&
            typeof subgame.scores === "object" &&
            !Array.isArray(subgame.scores) &&
            Object.values(subgame.scores)
                .every(Number.isFinite)
        )
    );

    return validTeams && validGames;

}

$("restore-file").addEventListener("change", async e => {

    const file = e.target.files[0];

    if (!file) return;

    try {

        const restored = JSON.parse(await file.text());

        if (!isValidBackup(restored)) {
            throw new Error("無効なデータ");
        }

        if (!confirm(
            "現在のデータをバックアップ内容で"
            + "上書きしますか？"
        )) return;

        state = restored;

        saveData();
        renderAll();

        showToast("データを復元しました");

    } catch {

        showToast("復元できないファイルです");

    } finally {

        e.target.value = "";

    }

});

$("reset-data").addEventListener("click", () => {

    if (!confirm(
        "すべての班・ゲーム・得点を削除しますか？"
    )) return;

    if (!confirm("本当に初期化してよろしいですか？")) {
        return;
    }

    state = createInitialData();

    saveData();
    renderAll();

    showToast("データを初期化しました");

});


/* =========================
   15. 結果出力との連携
========================= */

function renderResultTeams() {

    const select = $("result-team");
    const previous = select.value;

    select.innerHTML = state.teams.map(team => `

        <option value="${team.id}">
            ${escapeHTML(team.name)}
        </option>

    `).join("");

    if (state.teams.some(team => team.id === previous)) {
        select.value = previous;
    }

}

function refreshExport() {

    if (typeof renderResultPreview === "function") {

        renderResultPreview();

    }

}


/* =========================
   16. 全画面の更新
========================= */

function refreshScores() {

    renderDashboard();
    renderScoreTable();
    renderResultTeams();

    // ゲーム管理画面の得点だけ更新
    // 入力中のカーソル位置を維持する

    state.games.forEach(game => {

        game.subgames.forEach(subgame => {

            state.teams.forEach(team => {

                const display = document.querySelector(
                    `[data-score-display="${subgame.id}-${team.id}"]`
                );

                if (display) {

                    display.textContent =
                        formatScore(
                            getSubgameScore(subgame, team.id)
                        ) + " pt";

                }

            });

        });

        const summary = document.querySelector(
            `[data-game-summary="${game.id}"]`
        );

        if (summary) {

            summary.innerHTML = renderGameRanking(game);

        }

    });

    refreshExport();

}

function renderAll() {

    renderDashboard();
    renderTeams();
    renderGames();
    renderScoreTable();
    renderSettings();
    renderResultTeams();
    refreshExport();

}


/* =========================
   17. アプリ起動
========================= */

renderAll();
