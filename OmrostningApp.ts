import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { ISetting, SettingType } from "@rocket.chat/apps-engine/definition/settings";
import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { OmrostningCommand, RostCommand, PollCommand } from "./src/commands/OmrostningCommand";
import { PollTimeoutProcessor } from "./src/processors/PollTimeoutProcessor";
import { createPollMessage } from "./src/lib/createPollMessage";
import { schedulePollClose } from "./src/lib/schedulePollClose";
import { votePoll } from "./src/lib/votePoll";
import { finishPoll } from "./src/lib/finishPoll";
import { reopenPoll } from "./src/lib/reopenPoll";
import { getPoll } from "./src/lib/getPoll";
import { storePoll } from "./src/lib/storePoll";
import { editPollModal } from "./src/lib/editPollModal";
import { deleteDraftPoll } from "./src/lib/draftPoll";
import { clearVote } from "./src/lib/clearVote";
import { updatePoll } from "./src/lib/updatePoll";
import { IPollCreateData } from "./src/definition";
import { Language, t } from "./src/lib/i18n";

export class OmrostningApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    
    public async getLanguage(read: IRead): Promise<Language> {
        try {
            const setting = await read.getEnvironmentReader().getSettings().getValueById("language");
            if (setting === "sv") {
                return "sv";
            }
        } catch (e) {
            // Fallback to English
        }
        return "en";
    }

public async initialize(
        configurationExtend: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        // Language setting
        await configurationExtend.settings.provideSetting({
            id: "language",
            type: SettingType.SELECT,
            packageValue: "en",
            required: true,
            public: true,
            i18nLabel: "Language",
            values: [
                { key: "en", i18nLabel: "English" },
                { key: "sv", i18nLabel: "Svenska" },
            ],
        });

        await configurationExtend.slashCommands.provideSlashCommand(
            new OmrostningCommand()
        );
        await configurationExtend.slashCommands.provideSlashCommand(
            new RostCommand()
        );
        await configurationExtend.slashCommands.provideSlashCommand(
            new PollCommand()
        );

        await configurationExtend.scheduler.registerProcessors([
            new PollTimeoutProcessor(this),
        ]);
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const viewId = data.view.id;
        const user = data.user;
        const state = data.view.state as Record<string, Record<string, string>>;

        // Hantera redigering av poll (och draft-skapande)
        if (viewId.startsWith("edit_poll_modal---")) {
            const editParts = viewId.replace("edit_poll_modal---", "").split("---");
            const pollId = editParts[0];
            
            const newQuestion = state?.edit_question?.question?.trim();
            if (!newQuestion) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId,
                    errors: { question: "Du måste ange en fråga." },
                });
            }

            const newOptions: string[] = [];
            for (let i = 0; i < 10; i++) {
                const opt = state?.["edit_option_" + i]?.["option_" + i]?.trim();
                if (opt) {
                    newOptions.push(opt);
                }
            }

            if (newOptions.length < 2) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId,
                    errors: { option_0: "Du måste ha minst 2 alternativ." },
                });
            }

            // Hämta inställningar
            const voteType = state?.edit_poll_type?.vote_type;
            const singleChoice = voteType ? voteType === "single" : undefined;
            const timeLimitStr = state?.edit_poll_time_limit?.time_limit;
            const timeLimit = timeLimitStr ? parseInt(timeLimitStr, 10) : undefined;
            const anonymousStr = state?.edit_poll_anonymous?.anonymous;
            const confidential = anonymousStr === "yes";

            // Kolla om detta är en draft
            const poll = await getPoll(read.getPersistenceReader(), pollId);
            const editLang = await this.getLanguage(read);

            if (poll?.isDraft) {
                // Det är en draft - skapa meddelandet
                const room = await read.getRoomReader().getById(poll.roomId);
                if (!room) {
                    return context.getInteractionResponder().viewErrorResponse({
                        viewId,
                        errors: { question: "Kunde inte hitta rummet." },
                    });
                }

                const pollData = {
                    question: newQuestion,
                    options: newOptions,
                    singleChoice: singleChoice !== undefined ? singleChoice : true,
                    confidential: confidential,
                    showResults: true,
                    timeLimit: timeLimit && timeLimit > 0 ? timeLimit : undefined,
                };
                
                // Ta bort draften
                await deleteDraftPoll(persistence, pollId);
                
                // Skapa den riktiga pollen med meddelande
                const newPollId = await createPollMessage(modify, persistence, room, user, pollData, editLang);
                
                if (pollData.timeLimit && pollData.timeLimit > 0) {
                    const newPoll = await getPoll(read.getPersistenceReader(), newPollId);
                    if (newPoll) {
                        await schedulePollClose(modify, newPoll);
                    }
                }
            } else {
                // Det är en befintlig poll - uppdatera som vanligt
                await updatePoll(read, modify, persistence, pollId, newQuestion, newOptions, user, singleChoice, timeLimit, confidential, editLang);
            }
            return { success: true };
        }


        // Hantera skapande av ny poll
        if (!viewId.startsWith("create_poll_modal---")) {
            return { success: true };
        }

        const parts = viewId.replace("create_poll_modal---", "").split("---");
        const roomId = parts[0];

        if (!roomId) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Kunde inte hitta rummet." },
            });
        }

        const question = state?.poll_question?.question?.trim();
        if (!question) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Du måste ange en fråga." },
            });
        }

        const options: string[] = [];
        for (let i = 1; i <= 10; i++) {
            const option = state?.["poll_option_" + i]?.["option_" + i]?.trim();
            if (option) {
                options.push(option);
            }
        }

        if (options.length < 2) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { option_1: "Du måste ange minst 2 alternativ." },
            });
        }

        const voteType = state?.poll_type?.vote_type || "single";
        const showResults = "always";
        const timeLimit = parseInt(state?.poll_time_limit?.time_limit || "0", 10);
        

        const pollData: IPollCreateData = {
            question,
            options,
            singleChoice: voteType === "single",
            confidential: false,
            showResults: showResults === "always",
            timeLimit: timeLimit > 0 ? timeLimit : undefined,
        };

        const room = await read.getRoomReader().getById(roomId);
        if (!room) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Kunde inte hitta rummet." },
            });
        }

        const lang = await this.getLanguage(read);
        const pollId = await createPollMessage(
            modify,
            persistence,
            room,
            user,
            pollData,
            lang
        );

        if (pollData.timeLimit && pollData.timeLimit > 0) {
            const poll = await getPoll(read.getPersistenceReader(), pollId);
            if (poll) {
                await schedulePollClose(modify, poll);
            }
        }

        return { success: true };
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const actionId = data.actionId;
        const user = data.user;
        const triggerId = data.triggerId;
        if (actionId.startsWith("vote_")) {
            const value = data.value || "";
            const parts = value.split("|");
            if (parts.length === 2) {
                const pollId = parts[0];
                const voteIndex = parseInt(parts[1], 10);
                const voteLang = await this.getLanguage(read);
                await votePoll(read, modify, persistence, pollId, voteIndex, user, voteLang);
            }
        }

        if (actionId === "clear_vote") {
            const pollId = data.value || "";
            const clearLang = await this.getLanguage(read);
            await clearVote(read, modify, persistence, pollId, user, clearLang);
        }

        
        // Hantera "Lägg till" i edit-modal
        if (actionId === "edit_add_option" && triggerId) {
            const value = data.value || "";
            const parts = value.split("|");
            const pollId = parts[0];
            const newOptionCount = parseInt(parts[1] || "3", 10);
            
            let poll = await getPoll(read.getPersistenceReader(), pollId);
            if (poll && poll.uid === user.id) {
                // Försök läsa state och spara till databasen
                const viewState = (data as any).view?.state as Record<string, Record<string, string>> | undefined;
                if (viewState) {
                    const newQuestion = viewState?.edit_question?.question || poll.question;
                    const newOptions: string[] = [];
                    for (let i = 0; i < 10; i++) {
                        const opt = viewState?.["edit_option_" + i]?.["option_" + i];
                        if (opt !== undefined) {
                            newOptions.push(opt);
                        } else if (poll.options[i]) {
                            newOptions.push(poll.options[i]);
                        }
                    }
                    const voteType = viewState?.edit_poll_type?.vote_type;
                    const timeLimitStr = viewState?.edit_poll_time_limit?.time_limit;
                    
                    // Uppdatera pollen
                    poll.question = newQuestion;
                    poll.options = newOptions.length >= 2 ? newOptions : poll.options;
                    if (voteType) poll.singleChoice = voteType === "single";
                    if (timeLimitStr) poll.timeLimit = parseInt(timeLimitStr, 10) || undefined;
                    
                    await storePoll(persistence, poll);
                    poll = await getPoll(read.getPersistenceReader(), pollId) || poll;
                }
                
                const editModalLang = await this.getLanguage(read);
                await editPollModal(modify, user, poll, triggerId, newOptionCount, editModalLang);
            }
            return { success: true };
        }

        // Hantera "Ta bort" i edit-modal
        if (actionId === "edit_remove_option" && triggerId) {
            const value = data.value || "";
            const parts = value.split("|");
            const pollId = parts[0];
            const newOptionCount = parseInt(parts[1] || "2", 10);
            
            let poll = await getPoll(read.getPersistenceReader(), pollId);
            if (poll && poll.uid === user.id) {
                // Försök läsa state och spara till databasen
                const viewState = (data as any).view?.state as Record<string, Record<string, string>> | undefined;
                if (viewState) {
                    const newQuestion = viewState?.edit_question?.question || poll.question;
                    const newOptions: string[] = [];
                    for (let i = 0; i < 10; i++) {
                        const opt = viewState?.["edit_option_" + i]?.["option_" + i];
                        if (opt !== undefined) {
                            newOptions.push(opt);
                        } else if (poll.options[i]) {
                            newOptions.push(poll.options[i]);
                        }
                    }
                    const voteType = viewState?.edit_poll_type?.vote_type;
                    const timeLimitStr = viewState?.edit_poll_time_limit?.time_limit;
                    
                    // Uppdatera pollen
                    poll.question = newQuestion;
                    poll.options = newOptions.length >= 2 ? newOptions : poll.options;
                    if (voteType) poll.singleChoice = voteType === "single";
                    if (timeLimitStr) poll.timeLimit = parseInt(timeLimitStr, 10) || undefined;
                    
                    await storePoll(persistence, poll);
                    poll = await getPoll(read.getPersistenceReader(), pollId) || poll;
                }
                
                const editModalLang = await this.getLanguage(read);
                await editPollModal(modify, user, poll, triggerId, newOptionCount, editModalLang);
            }
            return { success: true };
        }

        if (actionId === "edit_poll") {
            const pollId = data.value || "";
            const poll = await getPoll(read.getPersistenceReader(), pollId);
            const editLang = await this.getLanguage(read);
            
            if (!poll) {
                return { success: true };
            }
            
            if (poll.uid !== user.id) {
                const room = await read.getRoomReader().getById(poll.roomId);
                if (room) {
                    const notifier = modify.getNotifier();
                    const msg = modify.getCreator().startMessage()
                        .setSender(user)
                        .setRoom(room)
                        .setText(t("error_only_creator", editLang));
                    await notifier.notifyUser(user, msg.getMessage());
                }
                return { success: true };
            }
            
            if (!poll.finished && triggerId) {
                await editPollModal(modify, user, poll, triggerId, undefined, editLang);
            }
        }

        if (actionId === "finish_poll") {
            const pollId = data.value || "";
            const finishLang = await this.getLanguage(read);
            const result = await finishPoll(read, modify, persistence, pollId, user, finishLang);
            
            if (!result.success) {
                const poll = await getPoll(read.getPersistenceReader(), pollId);
                if (poll) {
                    const room = await read.getRoomReader().getById(poll.roomId);
                    if (room) {
                        const notifier = modify.getNotifier();
                        const msg = modify.getCreator().startMessage()
                            .setSender(user)
                            .setRoom(room)
                            .setText(t("error_only_creator", finishLang));
                        await notifier.notifyUser(user, msg.getMessage());
                    }
                }
            }
        }

        if (actionId === "reopen_poll") {
            const pollId = data.value || "";
            const reopenLang = await this.getLanguage(read);
            const result = await reopenPoll(read, modify, persistence, pollId, user, reopenLang);
            
            if (!result.success) {
                const poll = await getPoll(read.getPersistenceReader(), pollId);
                if (poll) {
                    const room = await read.getRoomReader().getById(poll.roomId);
                    if (room) {
                        const notifier = modify.getNotifier();
                        const msg = modify.getCreator().startMessage()
                            .setSender(user)
                            .setRoom(room)
                            .setText(t("error_only_creator", reopenLang));
                        await notifier.notifyUser(user, msg.getMessage());
                    }
                }
            }
        }

        return { success: true };
    }
}
