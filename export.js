
/* =========================
   1. 結果プレビューの生成
========================= */

function renderResultPreview() {

    const preview = $("result-preview");

    const layout = $("result-layout").value;
    const theme = $("result-theme").value;
    const showGameScores = $("export-game-scores").checked;

    $("result-team").disabled = layout !== "team";

    preview.className = `theme-${theme}`;

    if (state.teams.length === 0) {

        preview.innerHTML = `
            <div class="result-header">
                <h1>結果プレビュー</h1>
                <p>班を登録すると結果が表示されます</p>
            </div>
        `;

        return;

    }

    switch (layout) {

        case "ranking":

            preview.innerHTML =
                renderRankingResult(showGameScores);

            break;

        case "detail":

            preview.innerHTML =
                renderDetailResult(showGameScores);

            break;

        case "team":

            preview.innerHTML =
                renderTeamResult(showGameScores);

            break;

    }

}


/* =========================
   2. 共通ヘッダー・フッター
========================= */

function resultHeader(title) {

    const theme = $("result-theme").value;

    return `

        <div class="result-header">

            <div class="result-eyebrow">
                ${
                    theme === "christmas"
                        ? "✦ CHRISTMAS PARTY ✦"
                        : "PARTY SCORE"
                }
            </div>

            <h1>
                ${escapeHTML(state.eventName)}
            </h1>

            <h2>
                ${escapeHTML(title)}
            </h2>

        </div>

    `;

}

function resultFooter() {

    const date = state.eventDate
        ? state.eventDate.replaceAll("-", ".")
        : "";

    return `

        <div class="result-footer">

            ${escapeHTML(date)}

            <div style="
                margin-top:6px;
                font-size:10px;
                letter-spacing:3px;
            ">
                PARTY SCORE
            </div>

        </div>

    `;

}

function rankLabel(rank) {

    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";

    return `${rank}th`;

}


/* =========================
   3. 総合順位ポスター
========================= */

function renderRankingResult(showGameScores) {

    const rankings = getRankings();

    const rows = rankings.map(team => `

        <div style="
            margin-bottom:12px;
            break-inside:avoid;
        ">

            <div class="
                result-ranking-row
                place-${team.rank}
            " style="margin-bottom:0;">

                <div class="result-rank">
                    ${rankLabel(team.rank)}
                </div>

                <div class="result-team-name">
                    ${escapeHTML(team.name)}
                </div>

                <div class="result-score">
                    ${formatScore(team.score)}
                    <small>pt</small>
                </div>

            </div>

            ${
                showGameScores && state.games.length

                ? `

                    <div style="
                        display:flex;
                        flex-wrap:wrap;
                        gap:8px 20px;
                        padding:10px 16px;
                        font-size:12px;
                        opacity:0.85;
                    ">

                        ${state.games.map(game => `

                            <span>

                                ${escapeHTML(game.name)}：
                                <strong>
                                    ${formatScore(
                                        getGameScore(
                                            game,
                                            team.id
                                        )
                                    )} pt
                                </strong>

                            </span>

                        `).join("")}

                    </div>

                `

                : ""

            }

        </div>

    `).join("");

    return `

        ${resultHeader("FINAL RESULT")}

        ${rows}

        ${resultFooter()}

    `;

}


/* =========================
   4. 詳細得点集計表
========================= */

function renderDetailResult(showGameScores) {

    const rankings = getRankings();

    const showSubgames = $("show-subgames").checked;

    let headers = `
        <th>順位</th>
        <th>班名</th>
    `;

    if (showGameScores) {

        state.games.forEach(game => {

            headers += `
                <th>
                    ${escapeHTML(game.name)}
                </th>
            `;

            if (showSubgames) {

                game.subgames.forEach(subgame => {

                    headers += `

                        <th style="font-size:10px;">

                            ${escapeHTML(game.name)}

                            <br>

                            ${escapeHTML(subgame.name)}

                        </th>

                    `;

                });

            }

        });

    }

    headers += "<th>合計</th>";

    const rows = rankings.map(team => {

        let cells = `

            <td>
                <strong>${team.rank}位</strong>
            </td>

            <td>
                ${escapeHTML(team.name)}
            </td>

        `;

        if (showGameScores) {

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

                            <td style="font-size:12px;">

                                ${formatScore(
                                    getSubgameScore(
                                        subgame,
                                        team.id
                                    )
                                )}

                            </td>

                        `;

                    });

                }

            });

        }

        cells += `

            <td style="font-weight:800;">
                ${formatScore(team.score)}
            </td>

        `;

        return `<tr>${cells}</tr>`;

    }).join("");

    return `

        ${resultHeader("SCORE REPORT")}

        <table class="result-detail-table">

            <thead>
                <tr>${headers}</tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>

        </table>

        <div style="
            font-size:11px;
            margin-top:20px;
            opacity:0.7;
        ">
            ※ 同点の場合は同順位としています。
        </div>

        ${resultFooter()}

    `;

}


/* =========================
   5. 班別リザルトカード
========================= */

function renderTeamResult(showGameScores) {

    const teamId = $("result-team").value;

    const rankings = getRankings();

    const team = rankings.find(
        t => t.id === teamId
    );

    if (!team) {

        return `
            <div class="empty-state">
                対象チームを選択してください
            </div>
        `;

    }

    const gameScores = state.games.map(game => {

        const score = getGameScore(game, team.id);

        const gameRank = getRankings(game)
            .find(t => t.id === team.id);

        return `

            <div class="result-breakdown">

                <div style="text-align:left;">

                    <strong>
                        ${escapeHTML(game.name)}
                    </strong>

                    <div style="
                        font-size:12px;
                        opacity:0.7;
                    ">
                        ゲーム内 ${gameRank.rank}位
                    </div>

                </div>

                <strong>
                    ${formatScore(score)} pt
                </strong>

            </div>

        `;

    }).join("");

    return `

        ${resultHeader("TEAM RESULT")}

        <div class="team-result-card">

            <h2>
                ${escapeHTML(team.name)}
            </h2>

            <div style="
                font-size:13px;
                letter-spacing:3px;
                opacity:0.8;
            ">
                OVERALL RANK
            </div>

            <div class="big-rank">
                ${rankLabel(team.rank)}
            </div>

            <div class="big-score">

                ${formatScore(team.score)}

                <span style="font-size:16px;">
                    pt
                </span>

            </div>

            ${
                showGameScores

                    ? `<div>${gameScores}</div>`

                    : ""

            }

        </div>

        ${resultFooter()}

    `;

}


/* =========================
   6. 出力設定の変更
========================= */

[
    "result-layout",
    "result-theme",
    "result-team",
    "export-game-scores",
    "show-subgames"

].forEach(id => {

    $(id).addEventListener(
        "change",
        renderResultPreview
    );

});


/* =========================
   7. 保存ファイル名
========================= */

function getExportFilename(extension) {

    const eventName = state.eventName
        .replace(/[\\/:*?"<>|]/g, "_");

    const layout = $("result-layout").value;

    let suffix = "";

    if (layout === "ranking") {

        suffix = "総合順位";

    } else if (layout === "detail") {

        suffix = "得点集計表";

    } else {

        const team = state.teams.find(
            t => t.id === $("result-team").value
        );

        suffix = team
            ? team.name.replace(/[\\/:*?"<>|]/g, "_")
            : "班別結果";

    }

    return `${eventName}_${suffix}.${extension}`;

}


/* =========================
   8. プレビューを画像化
========================= */

async function captureResult() {

    if (typeof html2canvas !== "function") {

        throw new Error(
            "画像出力ライブラリが読み込めません"
        );

    }

    renderResultPreview();

    if (document.fonts) {

        await document.fonts.ready;

    }

    const preview = $("result-preview");

    const canvas = await html2canvas(preview, {

        scale: 3,

        backgroundColor: null,

        useCORS: true,

        logging: false,

        width: preview.offsetWidth,

        height: preview.offsetHeight,

        windowWidth: Math.max(
            1200,
            preview.offsetWidth + 100
        )

    });

    return canvas;

}

function setExportLoading(loading) {

    $("download-png").disabled = loading;
    $("download-pdf").disabled = loading;
    $("download-csv").disabled = loading;

}


/* =========================
   9. PNG画像として保存
========================= */

$("download-png").addEventListener(
    "click",
    async () => {

        if (!state.teams.length) {

            showToast("班を登録してください");
            return;

        }

        setExportLoading(true);

        try {

            showToast("画像を生成しています");

            const filename = getExportFilename("png");

            const canvas = await captureResult();

            const blob = await new Promise(resolve => {

                canvas.toBlob(resolve, "image/png");

            });

            if (!blob) {
                throw new Error("画像生成に失敗しました");
            }

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download = filename;

            document.body.appendChild(link);

            link.click();

            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            showToast("PNG画像を生成しました");

        } catch (error) {

            console.error(error);

            showToast("画像の生成に失敗しました");

        } finally {

            setExportLoading(false);

        }

    }
);


/* =========================
   10. PDFとして保存
========================= */

$("download-pdf").addEventListener(
    "click",
    async () => {

        if (!state.teams.length) {

            showToast("班を登録してください");
            return;

        }

        setExportLoading(true);

        try {

            if (!window.jspdf?.jsPDF) {

                throw new Error(
                    "PDFライブラリが読み込めません"
                );

            }

            showToast("PDFを生成しています");

            const filename = getExportFilename("pdf");

            const layout = $("result-layout").value;

            const canvas = await captureResult();

            const image = canvas.toDataURL("image/png");

            const { jsPDF } = window.jspdf;

            // 詳細集計表はA4横、それ以外はA4縦

            const orientation = layout === "detail"
                ? "landscape"
                : "portrait";

            const pdf = new jsPDF({

                orientation: orientation,

                unit: "mm",

                format: "a4"

            });

            const pageWidth =
                pdf.internal.pageSize.getWidth();

            const pageHeight =
                pdf.internal.pageSize.getHeight();

            const margin = 10;

            const availableWidth =
                pageWidth - margin * 2;

            const availableHeight =
                pageHeight - margin * 2;

            // 縦横比を維持して1ページに収める

            const ratio = Math.min(

                availableWidth / canvas.width,

                availableHeight / canvas.height

            );

            const imageWidth = canvas.width * ratio;

            const imageHeight = canvas.height * ratio;

            const x = (pageWidth - imageWidth) / 2;

            const y = (pageHeight - imageHeight) / 2;

            pdf.addImage(

                image,

                "PNG",

                x,

                y,

                imageWidth,

                imageHeight

            );

            pdf.save(filename);

            showToast("PDFを生成しました");

        } catch (error) {

            console.error(error);

            showToast("PDFの生成に失敗しました");

        } finally {

            setExportLoading(false);

        }

    }
);


/* =========================
   11. CSVとして保存
========================= */

function escapeCSV(value) {

    let text = String(value ?? "");

    // Excelで意図せず数式として
    // 解釈されることを防ぐ

    if (
        typeof value === "string" &&
        /^[\s]*[=+\-@]/.test(text)
    ) {

        text = "'" + text;

    }

    return `"${text.replaceAll('"', '""')}"`;

}

$("download-csv").addEventListener("click", () => {

    if (!state.teams.length) {

        showToast("班を登録してください");
        return;

    }

    const rankings = getRankings();

    const headers = [
        "順位",
        "班名"
    ];

    state.games.forEach(game => {

        headers.push(game.name + " 合計");

        game.subgames.forEach(subgame => {

            headers.push(
                `${game.name} / ${subgame.name}`
            );

        });

    });

    headers.push("総合得点");

    const rows = rankings.map(team => {

        const row = [
            team.rank,
            team.name
        ];

        state.games.forEach(game => {

            row.push(
                getGameScore(game, team.id)
            );

            game.subgames.forEach(subgame => {

                row.push(
                    getSubgameScore(
                        subgame,
                        team.id
                    )
                );

            });

        });

        row.push(team.score);

        return row;

    });

    const csv = [

        headers,

        ...rows

    ].map(row =>

        row.map(escapeCSV).join(",")

    ).join("\r\n");

    // Excelでの日本語文字化け対策

    const bom = "\uFEFF";

    downloadFile(

        bom + csv,

        state.eventName.replace(
            /[\\/:*?"<>|]/g,
            "_"
        ) + "_全得点一覧.csv",

        "text/csv;charset=utf-8;"

    );

    showToast("CSVを生成しました");

});


/* =========================
   12. 初期表示
========================= */

renderResultPreview();
