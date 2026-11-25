
/* =========================
   1. Supabase接続設定
========================= */

const SUPABASE_URL =
    "https://bxzpgotrzxcjjcarumak.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_7BzqIJyyM5ahVPhw1ER6Ww_ZavYmVgx";

const EVENT_ID = "christmas-2026";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================
   2. 接続確認
========================= */

async function testConnection() {

    try {

        const { data, error } = await db
            .from("events")
            .select("*")
            .eq("id", EVENT_ID)
            .single();

        if (error) throw error;

        $("save-status").textContent =
            "Supabase接続済み";

        console.log("Supabase接続成功", data);

        showToast("データベースに接続しました");

        return true;

    } catch (error) {

        console.error("接続エラー", error);

        $("save-status").textContent =
            "接続エラー";

        showToast("データベースに接続できません");

        return false;

    }

}


/* =========================
   3. ログイン画面の追加
========================= */

function createLoginPanel() {

    const panel = document.createElement("div");

    panel.className = "panel";

    panel.innerHTML = `

        <h2>オンライン管理</h2>

        <p id="cloud-auth-status">
            ログインしていません
        </p>

        <form id="cloud-login-form">

            <div class="form-group">

                <label>メールアドレス</label>

                <input
                    type="email"
                    id="cloud-email"
                    placeholder="メールアドレス"
                    required
                >

            </div>

            <div class="form-group">

                <label>パスワード</label>

                <input
                    type="password"
                    id="cloud-password"
                    placeholder="パスワード"
                    required
                >

            </div>

            <button
                type="submit"
                class="primary-btn"
                id="cloud-login"
            >
                ログイン
            </button>

        </form>

        <div class="input-row" style="margin-top:15px">

            <button
                class="secondary-btn"
                id="cloud-logout"
                hidden
            >
                ログアウト
            </button>

            <button
                class="secondary-btn"
                id="cloud-load"
            >
                接続確認
            </button>

        </div>

    `;

    const settings = $("settings");

    settings.querySelector(".page-heading")
        .after(panel);

    $("cloud-login-form").addEventListener(
        "submit",
        async e => {

            e.preventDefault();

            await loginCloud();

        }
    );

    $("cloud-logout").addEventListener(
        "click",
        logoutCloud
    );

    $("cloud-load").addEventListener(
        "click",
        testConnection
    );

}


/* =========================
   4. ログイン
========================= */

async function loginCloud() {

    const email =
        $("cloud-email").value.trim();

    const password =
        $("cloud-password").value;

    $("cloud-login").disabled = true;

    try {

        const { data, error } = await db.auth
            .signInWithPassword({
                email: email,
                password: password
            });

        if (error) throw error;

        $("cloud-password").value = "";

        await updateAuthStatus();

        showToast("ログインしました");

    } catch (error) {

        console.error(error);

        showToast("ログインに失敗しました");

    } finally {

        $("cloud-login").disabled = false;

    }

}


/* =========================
   5. ログアウト
========================= */

async function logoutCloud() {

    const { error } = await db.auth.signOut();

    if (error) {

        showToast("ログアウトに失敗しました");

        return;

    }

    await updateAuthStatus();

    showToast("ログアウトしました");

}


/* =========================
   6. 編集権限の確認
========================= */

let isStaff = false;

async function updateAuthStatus() {

    isStaff = false;

    const { data, error } = await db.auth.getUser();

    const user = error ? null : data?.user;

    const status = $("cloud-auth-status");

    if (!user) {

        status.textContent =
            "ログインしていません";

        $("cloud-login-form").hidden = false;

        $("cloud-logout").hidden = true;

        return;

    }

    const result = await db
        .from("staff")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    isStaff = !result.error && !!result.data;

    if (result.error) {

        status.textContent =
            "編集権限を確認できませんでした";

    } else {

        status.textContent = isStaff
            ? `管理者：${user.email}`
            : `閲覧者：${user.email}`;

    }

    $("cloud-login-form").hidden = true;

    $("cloud-logout").hidden = false;

}


/* =========================
   7. クラウドデータ取得
========================= */

async function fetchCloudData() {

    const eventResult = await db
        .from("events")
        .select("*")
        .eq("id", EVENT_ID)
        .single();

    if (eventResult.error) {
        throw eventResult.error;
    }

    const [teamResult, gameResult] =
        await Promise.all([

            db.from("teams")
                .select("*")
                .eq("event_id", EVENT_ID)
                .order("position"),

            db.from("games")
                .select("*")
                .eq("event_id", EVENT_ID)
                .order("position")

        ]);

    if (teamResult.error) throw teamResult.error;
    if (gameResult.error) throw gameResult.error;

    const event = eventResult.data;
    const teams = teamResult.data;
    const games = gameResult.data;

    const gameIds = games.map(game => game.id);

    let subgames = [];

    if (gameIds.length) {

        const result = await db
            .from("subgames")
            .select("*")
            .in("game_id", gameIds)
            .order("position");

        if (result.error) throw result.error;

        subgames = result.data;

    }

    const subgameIds =
        subgames.map(subgame => subgame.id);

    let scores = [];

    if (subgameIds.length) {

        const result = await db
            .from("scores")
            .select("*")
            .in("subgame_id", subgameIds);

        if (result.error) throw result.error;

        scores = result.data;

    }

    return {

        eventName: event.name,

        eventDate: event.event_date || "",

        teams: teams.map(team => ({

            id: team.id,
            name: team.name

        })),

        games: games.map(game => ({

            id: game.id,
            name: game.name,

            subgames: subgames
                .filter(s => s.game_id === game.id)
                .map(subgame => ({

                    id: subgame.id,

                    name: subgame.name,

                    mode: subgame.mode,

                    points: Number(subgame.points),

                    rankPoints:
                        subgame.rank_points || [],

                    scores: Object.fromEntries(

                        teams.map(team => {

                            const score = scores.find(s =>
                                s.subgame_id === subgame.id &&
                                s.team_id === team.id
                            );

                            return [

                                team.id,

                                Number(score?.value || 0)

                            ];

                        })

                    )

                }))

        }))

    };

}


/* =========================
   8. 初期化
========================= */


/* =========================
   8. オンライン同期の管理
========================= */

let cloudReady = false;
let cloudBusy = false;
let cloudFailed = false;
let cloudPending = 0;
let cloudQueue = Promise.resolve();
let cloudSnapshot = null;

const localSaveData = saveData;

function cloneData(data) {

    return JSON.parse(JSON.stringify(data));

}


/* =========================
   9. 保存データの変換
========================= */

function createCloudRows(data) {

    return {

        events: [{

            id: EVENT_ID,
            name: data.eventName,
            event_date: data.eventDate || null

        }],

        teams: data.teams.map((team, index) => ({

            id: team.id,
            event_id: EVENT_ID,
            name: team.name,
            position: index

        })),

        games: data.games.map((game, index) => ({

            id: game.id,
            event_id: EVENT_ID,
            name: game.name,
            position: index

        })),

        subgames: data.games.flatMap(game =>

            game.subgames.map((subgame, index) => ({

                id: subgame.id,
                game_id: game.id,
                name: subgame.name,
                mode: subgame.mode,
                points: subgame.points,
                rank_points: subgame.rankPoints,
                position: index

            }))

        ),

        scores: data.games.flatMap(game =>

            game.subgames.flatMap(subgame =>

                data.teams.map(team => ({

                    subgame_id: subgame.id,
                    team_id: team.id,
                    value: number(
                        subgame.scores[team.id]
                    )

                }))

            )

        )

    };

}


/* =========================
   10. 変更箇所の検出
========================= */

function rowKey(table, row) {

    if (table === "scores") {

        return row.subgame_id
            + ":" + row.team_id;

    }

    return row.id;

}

function findChangedRows(table, before, after) {

    const oldRows = new Map(

        before.map(row => [

            rowKey(table, row),
            JSON.stringify(row)

        ])

    );

    return after.filter(row =>

        oldRows.get(rowKey(table, row))
            !== JSON.stringify(row)

    );

}

function findDeletedRows(table, before, after) {

    const keys = new Set(

        after.map(row => rowKey(table, row))

    );

    return before.filter(row =>

        !keys.has(rowKey(table, row))

    );

}


/* =========================
   11. Supabaseへの保存
========================= */

async function syncChanges(previous, current) {

    if (!isStaff || !cloudReady) {

        throw new Error("編集権限がありません");

    }

    const before = createCloudRows(previous);
    const after = createCloudRows(current);

    const tables = [

        "events",
        "teams",
        "games",
        "subgames",
        "scores"

    ];

    // 変更された行だけ保存する

    for (const table of tables) {

        const changed = findChangedRows(

            table,
            before[table],
            after[table]

        );

        if (!changed.length) continue;

        if (table === "scores") {

            // 各班・各小ゲームの得点を個別保存

            const { error } = await db
                .from(table)
                .upsert(

                    changed.map(row => ({

                        ...row,
                        updated_at:
                            new Date().toISOString()

                    })),

                    {
                        onConflict:
                            "subgame_id,team_id"
                    }

                );

            if (error) throw error;

        } else {

            const { error } = await db
                .from(table)
                .upsert(changed, {

                    onConflict: "id"

                });

            if (error) throw error;

        }

    }

    // 削除は子テーブルから先に行う

    for (const table of [

        "scores",
        "subgames",
        "games",
        "teams"

    ]) {

        const deleted = findDeletedRows(

            table,
            before[table],
            after[table]

        );

        for (const row of deleted) {

            let query = db.from(table).delete();

            if (table === "scores") {

                query = query
                    .eq(
                        "subgame_id",
                        row.subgame_id
                    )
                    .eq(
                        "team_id",
                        row.team_id
                    );

            } else {

                query = query.eq("id", row.id);

            }

            const { error } = await query;

            if (error) throw error;

        }

    }

}


/* =========================
   12. 自動保存との連携
========================= */

saveData = function () {

    if (!isStaff || !cloudReady) {

        showToast(
            "管理者としてログインしてください"
        );

        return;

    }

    localSaveData();

    const previous = cloneData(cloudSnapshot);
    const current = cloneData(state);

    cloudSnapshot = cloneData(current);

    cloudPending++;

    $("save-status").textContent =
        "オンライン保存中...";

    cloudQueue = cloudQueue.then(async () => {

        try {

            if (cloudFailed) {

                throw new Error(
                    "前回の保存に失敗しています"
                );

            }

            await syncChanges(previous, current);

        } catch (error) {

            console.error(error);

            cloudFailed = true;

            $("save-status").textContent =
                "オンライン保存失敗";

            showToast(
                "保存に失敗しました。"
                + "バックアップを保存してください"
            );

            applyAccessControl();

        } finally {

            cloudPending--;

            if (!cloudFailed && cloudPending === 0) {

                $("save-status").textContent =
                    "オンライン保存済み";

            }

        }

    });

};


/* =========================
   13. 編集権限の制御
========================= */

function applyAccessControl() {

    const canEdit =
        isStaff && cloudReady && !cloudFailed;

    [
        "teams",
        "games"
    ].forEach(id => {

        $(id).querySelectorAll(

            "input, select, button"

        ).forEach(element => {

            const isMoveButton = [

                "move-game-up",
                "move-game-down"

            ].includes(element.dataset.action);

            if (!isMoveButton || !canEdit) {

                element.disabled = !canEdit;

            }

        });

    });

    [
        "event-name",
        "event-date",
        "save-settings",
        "reset-data",
        "restore-data"

    ].forEach(id => {

        $(id).disabled = !canEdit;

    });

    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            button.disabled =
                !cloudReady &&
                button.dataset.page !== "settings";

        });

}

const originalRenderAll = renderAll;

renderAll = function () {

    originalRenderAll();

    applyAccessControl();

};


/* =========================
   14. クラウドデータの読み込み
========================= */

async function loadCloudState() {

    if (!isStaff) return;

    if (
        cloudPending > 0 ||
        cloudBusy ||
        cloudFailed
    ) return;

    cloudBusy = true;

    try {

        const data = await fetchCloudData();

        if (!isStaff) return;

        if (cloudPending > 0) return;

        // 入力途中の画面は更新しない

        const active = document.activeElement;

        if (
            cloudReady &&
            active?.matches(
                "input, select, textarea"
            )
        ) return;

        const changed = JSON.stringify(data)
            !== JSON.stringify(state);

        state = data;

        cloudSnapshot = cloneData(data);

        cloudReady = true;

        localSaveData();

        if (changed) {

            renderAll();

        } else {

            applyAccessControl();

        }

        $("save-status").textContent =
            "オンライン同期済み";

    } catch (error) {

        console.error(error);

        $("save-status").textContent =
            "同期エラー";

    } finally {

        cloudBusy = false;

    }

}


/* =========================
   15. 初期化とログイン連携
========================= */

const originalUpdateAuthStatus =
    updateAuthStatus;

updateAuthStatus = async function () {

    await originalUpdateAuthStatus();

    cloudReady = false;

    if (isStaff) {

        const previousLocalData =
            cloneData(state);

        const data = await fetchCloudData();

        state = data;

        cloudSnapshot = cloneData(data);

        cloudReady = true;
        cloudFailed = false;

        // クラウドが空の場合だけ
        // 既存ローカルデータを移行できる

        const cloudIsEmpty =

            data.teams.length === 0 &&
            data.games.length === 0;

        const localHasData =

            previousLocalData.teams.length > 0 ||
            previousLocalData.games.length > 0;

        if (
            cloudIsEmpty &&
            localHasData &&
            confirm(
                "現在のローカルデータを"
                + "オンラインに移行しますか？"
            )
        ) {

            state = previousLocalData;

            saveData();

        } else {

            localSaveData();

        }

        $("save-status").textContent =
            cloudPending > 0
                ? "オンライン保存中..."
                : "オンライン接続済み";

        renderAll();

    } else {

        state = createInitialData();

        cloudSnapshot = null;

        renderAll();

        document.querySelector(
            '[data-page="settings"]'
        ).click();

        $("save-status").textContent =
            "ログインが必要です";

    }

};


/* =========================
   16. ログアウトの制御
========================= */

$("settings").addEventListener(
    "click",
    e => {

        if (
            e.target.id === "cloud-logout" &&
            cloudPending > 0
        ) {

            e.stopImmediatePropagation();

            showToast(
                "保存が完了してから"
                + "ログアウトしてください"
            );

        }

    },
    true
);


/* =========================
   17. 定期同期
========================= */

setInterval(async () => {

    if (
        isStaff &&
        cloudReady &&
        !cloudFailed
    ) {

        await loadCloudState();

    }

}, 3000);


/* =========================
   18. 起動
========================= */

async function initializeCloud() {

    createLoginPanel();

    // 未認証の状態では接続確認を行わない

    applyAccessControl();

    await updateAuthStatus();

    if (isStaff) {

        await testConnection();

    }

}

initializeCloud().catch(error => {

    console.error(error);

    cloudReady = false;

    applyAccessControl();

    showToast(
        "オンライン設定に失敗しました"
    );

});

