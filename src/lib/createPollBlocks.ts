import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { IPoll } from "../definition";
import { t, Language } from "./i18n";

function buildVoteBar(votes: number, totalVotes: number): string {
    const percent = totalVotes === 0 ? 0 : votes / totalVotes;
    const percentText = (percent * 100).toFixed(0);
    const width = 10;
    const filled = Math.round(percent * width);
    const bar = "🟩".repeat(filled) + "⬜".repeat(width - filled);
    return bar + " " + percentText + "%";
}

function getRankEmoji(rank: number): string {
    if (rank === 1) return "🥇 ";
    if (rank === 2) return "🥈 ";
    if (rank === 3) return "🥉 ";
    return "";
}

export function createPollBlocks(
    block: BlockBuilder,
    poll: IPoll,
    showVoteButtons: boolean = true,
    lang: Language = "en",
    currentUserId?: string
): void {
    let headerText = "### " + poll.question;
    const metaItems: string[] = [];
    if (poll.finished) metaItems.push("✅");
    else if (poll.expiresAt) {
        const expiresDate = new Date(poll.expiresAt);
        const timeStr = expiresDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Stockholm" });
        metaItems.push(t("poll_ends_at", lang, { time: timeStr }));
    }
    if (poll.confidential) {
        metaItems.push("🔒 " + t("poll_anonymous", lang));
    }
    if (metaItems.length > 0) {
        headerText += "  " + metaItems.join(" · ");
    }

    block.addSectionBlock({
        text: block.newMarkdownTextObject(headerText),
    });

    const shouldShowResults = poll.showResults || poll.finished;

    let rankings: number[] = [];
    if (poll.finished && poll.totalVotes > 0) {
        const sortedVotes = [...poll.votes.map(v => v.quantity)].sort((a, b) => b - a);
        rankings = poll.votes.map(v => {
            if (v.quantity === 0) return 99;
            return sortedVotes.indexOf(v.quantity) + 1;
        });
    }

    if (showVoteButtons && !poll.finished) {
        const buttons = poll.options.map((option, index) => {
            return block.newButtonElement({
                text: block.newPlainTextObject(option),
                actionId: "vote_" + index,
                value: poll.id + "|" + index,
            });
        });
        block.addActionsBlock({ elements: buttons });
        if (shouldShowResults && poll.totalVotes > 0) {
            block.addDividerBlock();
        }
    } else if (poll.finished) {
        block.addDividerBlock();
    }

    if (shouldShowResults && poll.totalVotes > 0) {
        let resultsText = "";
        poll.options.forEach((option, index) => {
            const voteData = poll.votes[index];
            const votes = voteData?.quantity || 0;
            const voters = voteData?.voters || [];

            // Check if current user voted for this option
            const userVoted = currentUserId && voters.some(v => v.id === currentUserId);
            const yourVoteMarker = userVoted ? " ✓" : "";

            let prefix = "";
            if (poll.finished && rankings[index] <= 3) {
                prefix = getRankEmoji(rankings[index]);
            }

            resultsText += prefix + "**" + option + "**" + yourVoteMarker + "  " + buildVoteBar(votes, poll.totalVotes) + " (" + votes + ")\n";

            // Show voter names if not confidential and there are voters
            if (!poll.confidential && voters.length > 0) {
                const voterNames = voters.map(v => v.name || v.username).join(", ");
                resultsText += "_" + voterNames + "_\n";
            }
        });
        block.addSectionBlock({
            text: block.newMarkdownTextObject(resultsText.trim()),
        });
    } else if (poll.finished && poll.totalVotes === 0) {
        let resultsText = "";
        poll.options.forEach((option) => {
            resultsText += "**" + option + "**  " + buildVoteBar(0, 0) + " (0)\n";
        });
        block.addSectionBlock({
            text: block.newMarkdownTextObject(resultsText.trim()),
        });
    }

    const totalText = poll.totalVotes === 1 
        ? t("poll_total_votes_one", lang)
        : t("poll_total_votes", lang, { count: poll.totalVotes });
    block.addContextBlock({
        elements: [block.newMarkdownTextObject(totalText)],
    });

    if (showVoteButtons) {
        const controlButtons = [];
        if (!poll.finished) {
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("🗑️ " + t("button_remove_vote", lang)),
                    actionId: "clear_vote",
                    value: poll.id,
                })
            );
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("✏️ " + t("button_edit", lang)),
                    actionId: "edit_poll",
                    value: poll.id,
                })
            );
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject(t("button_end", lang)),
                    actionId: "finish_poll",
                    value: poll.id,
                })
            );
        } else {
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject(t("button_reopen", lang)),
                    actionId: "reopen_poll",
                    value: poll.id,
                })
            );
        }
        block.addActionsBlock({ elements: controlButtons });
    }
}
