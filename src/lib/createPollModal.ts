import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { t, Language } from "./i18n";

export interface IDraftPoll {
    question: string;
    options: string[];
    voteType: string;
    timeLimit: string;
}

export async function saveDraftPoll(
    persistence: IPersistence,
    oderId: string,
    draft: IDraftPoll
): Promise<void> {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        "draft_poll_" + oderId
    );
    await persistence.updateByAssociation(association, draft, true);
}

export async function getDraftPoll(
    read: IRead,
    oderId: string
): Promise<IDraftPoll | undefined> {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        "draft_poll_" + oderId
    );
    const results = await read.getPersistenceReader().readByAssociation(association);
    if (results && results.length > 0) {
        return results[0] as IDraftPoll;
    }
    return undefined;
}

export async function deleteDraftPoll(
    persistence: IPersistence,
    oderId: string
): Promise<void> {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        "draft_poll_" + oderId
    );
    await persistence.removeByAssociation(association);
}

export async function createPollModal(
    modify: IModify,
    user: IUser,
    room: IRoom,
    triggerId: string,
    lang: Language = "en",
    optionCount: number = 2,
    draft?: IDraftPoll
): Promise<void> {
    const block = modify.getCreator().getBlockBuilder();

    // Fråga
    block.addInputBlock({
        blockId: "poll_question",
        label: block.newPlainTextObject(t("modal_question_label", lang)),
        element: block.newPlainTextInputElement({
            actionId: "question",
            initialValue: draft?.question || "",
            placeholder: block.newPlainTextObject(t("modal_question_placeholder", lang)),
        }),
    });

    // Alternativ (dynamiskt antal)
    for (let i = 1; i <= optionCount; i++) {
        const isRequired = i <= 2;
        block.addInputBlock({
            blockId: "poll_option_" + i,
            optional: !isRequired,
            label: block.newPlainTextObject(t("modal_option_label", lang) + " " + i),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                initialValue: draft?.options?.[i - 1] || "",
            }),
        });
    }

    // Knappar för att lägga till/ta bort alternativ
    const actionButtons: any[] = [];
    
    if (optionCount < 10) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "add_option",
                text: block.newPlainTextObject(t("modal_add_option", lang)),
                value: String(optionCount + 1),
            })
        );
    }
    
    if (optionCount > 2) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "remove_option",
                text: block.newPlainTextObject(t("modal_remove_option", lang)),
                value: String(optionCount - 1),
            })
        );
    }
    
    if (actionButtons.length > 0) {
        block.addActionsBlock({
            blockId: "option_buttons_block",
            elements: actionButtons,
        });
    }

    // Divider
    block.addDividerBlock();

    // Röstningstyp
    block.addInputBlock({
        blockId: "poll_type",
        label: block.newPlainTextObject(t("modal_vote_type_label", lang)),
        element: block.newStaticSelectElement({
            actionId: "vote_type",
            initialValue: draft?.voteType || "single",
            options: [
                {
                    text: block.newPlainTextObject(t("modal_vote_type_single", lang)),
                    value: "single",
                },
                {
                    text: block.newPlainTextObject(t("modal_vote_type_multiple", lang)),
                    value: "multiple",
                },
            ],
        }),
    });

    // Tidsgräns
    block.addInputBlock({
        blockId: "poll_time_limit",
        label: block.newPlainTextObject(t("modal_time_limit_label", lang)),
        element: block.newStaticSelectElement({
            actionId: "time_limit",
            initialValue: draft?.timeLimit || "0",
            options: [
                { text: block.newPlainTextObject(t("modal_time_limit_none", lang)), value: "0" },
                { text: block.newPlainTextObject(t("time_5min", lang)), value: "5" },
                { text: block.newPlainTextObject(t("time_15min", lang)), value: "15" },
                { text: block.newPlainTextObject(t("time_30min", lang)), value: "30" },
                { text: block.newPlainTextObject(t("time_1h", lang)), value: "60" },
                { text: block.newPlainTextObject(t("time_2h", lang)), value: "120" },
                { text: block.newPlainTextObject(t("time_24h", lang)), value: "1440" },
            ],
        }),
    });

    await modify.getUiController().openModalView(
        {
            id: "create_poll_modal---" + room.id + "---" + optionCount,
            title: block.newPlainTextObject(t("modal_title", lang)),
            close: block.newButtonElement({
                text: block.newPlainTextObject(t("button_cancel", lang)),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject(t("modal_submit", lang)),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        user
    );
}
