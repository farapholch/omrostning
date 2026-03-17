import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll } from "../definition";

export async function editPollModal(
    modify: IModify,
    user: IUser,
    poll: IPoll,
    triggerId: string
): Promise<void> {
    const block = modify.getCreator().getBlockBuilder();

    // Fråga (förifyld)
    block.addInputBlock({
        blockId: "edit_question",
        label: block.newPlainTextObject("Fråga"),
        element: block.newPlainTextInputElement({
            actionId: "question",
            initialValue: poll.question,
            placeholder: block.newPlainTextObject("Vad vill du fråga?"),
        }),
    });

    // Befintliga alternativ
    poll.options.forEach((option, index) => {
        block.addInputBlock({
            blockId: "edit_option_" + index,
            label: block.newPlainTextObject("Alternativ " + (index + 1)),
            element: block.newPlainTextInputElement({
                actionId: "option_" + index,
                initialValue: option,
                placeholder: block.newPlainTextObject("Alternativ"),
            }),
        });
    });

    // Lägg till nytt alternativ (upp till 10 totalt)
    for (let i = poll.options.length; i < 10; i++) {
        block.addInputBlock({
            blockId: "edit_option_" + i,
            optional: true,
            label: block.newPlainTextObject("Nytt alternativ " + (i + 1) + " (valfritt)"),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                placeholder: block.newPlainTextObject("Lägg till alternativ"),
            }),
        });
        if (i >= poll.options.length + 2) break; // Max 3 nya åt gången
    }

    await modify.getUiController().openModalView(
        {
            id: "edit_poll_modal---" + poll.id,
            title: block.newPlainTextObject("Redigera omröstning"),
            close: block.newButtonElement({
                text: block.newPlainTextObject("Avbryt"),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject("Spara"),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        user
    );
}
