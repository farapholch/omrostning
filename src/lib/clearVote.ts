import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function clearVote(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    pollId: string,
    user: IUser
): Promise<{ success: boolean; message?: string; cleared: boolean }> {
    const poll = await getPoll(read.getPersistenceReader(), pollId);
    
    if (!poll) {
        return { success: false, message: "Omröstningen hittades inte.", cleared: false };
    }

    if (poll.finished) {
        return { success: false, message: "Omröstningen är avslutad.", cleared: false };
    }

    // Ta bort användarens röst från alla alternativ
    let cleared = false;
    for (let i = 0; i < poll.votes.length; i++) {
        const voterIndex = poll.votes[i].voters.findIndex(v => v.id === user.id);
        if (voterIndex !== -1) {
            poll.votes[i].voters.splice(voterIndex, 1);
            poll.votes[i].quantity--;
            poll.totalVotes--;
            cleared = true;
        }
    }

    if (!cleared) {
        return { success: true, message: "Du har ingen röst att ta bort.", cleared: false };
    }

    await storePoll(persistence, poll);

    // Uppdatera meddelandet
    if (poll.visibleMsgId) {
        const room = await read.getRoomReader().getById(poll.roomId);
        if (room) {
            try {
                const msgReader = read.getMessageReader();
                const originalMsg = await msgReader.getById(poll.visibleMsgId);
                
                if (originalMsg && originalMsg.sender) {
                    const updater = await modify.getUpdater().message(poll.visibleMsgId, originalMsg.sender);
                    updater.setRoom(room);
                    
                    const block = modify.getCreator().getBlockBuilder();
                    createPollBlocks(block, poll, true);
                    updater.setBlocks(block);
                    
                    await modify.getUpdater().finish(updater);
                }
            } catch (e) {
                // Ignorera fel
            }
        }
    }

    return { success: true, cleared: true };
}
