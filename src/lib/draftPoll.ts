import {
    IPersistence,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IPoll, IVoteOption } from "../definition";
import { storePoll } from "./storePoll";
import { v4 as uuidv4 } from "uuid";

export async function createDraftPoll(
    persistence: IPersistence,
    room: IRoom,
    user: IUser
): Promise<IPoll> {
    const pollId = uuidv4 ? uuidv4() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    const emptyVotes: IVoteOption[] = [
        { quantity: 0, voters: [] },
        { quantity: 0, voters: [] },
        { quantity: 0, voters: [] },
        { quantity: 0, voters: [] },
    ];
    
    const poll: IPoll = {
        id: pollId,
        visibleMsgId: "",
        uid: user.id,
        username: user.username,
        roomId: room.id,
        question: "",
        options: ["", "", ""],
        totalVotes: 0,
        votes: emptyVotes,
        singleChoice: true,
        confidential: false,
        showResults: true,
        finished: false,
        createdAt: new Date(),
        isDraft: true,
    };
    
    await storePoll(persistence, poll);
    return poll;
}

export async function deleteDraftPoll(
    persistence: IPersistence,
    pollId: string
): Promise<void> {
    const { RocketChatAssociationModel, RocketChatAssociationRecord } = await import("@rocket.chat/apps-engine/definition/metadata");
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        "poll_" + pollId
    );
    await persistence.removeByAssociation(association);
}
