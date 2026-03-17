import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { createPollModal } from "../lib/createPollModal";
import { createPollMessage } from "../lib/createPollMessage";
import { IPollCreateData } from "../definition";

function parseArguments(argsArray: string[]): { question: string; options: string[] } | null {
    // Sätt ihop till en sträng
    const args = argsArray.join(" ");
    
    if (!args || args.trim().length === 0) {
        return null;
    }
    
    // Normalisera citattecken
    let normalized = args
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035'']/g, "'");
    
    // Metod 1: Parse med citattecken "Fråga?" "Alt1" "Alt2"
    const quoteRegex = /"([^"]+)"/g;
    const quoteMatches: string[] = [];
    let match;
    while ((match = quoteRegex.exec(normalized)) !== null) {
        quoteMatches.push(match[1].trim());
    }
    
    if (quoteMatches.length >= 3) {
        return {
            question: quoteMatches[0],
            options: quoteMatches.slice(1),
        };
    }
    
    // Metod 2: Pipe-separator: Fråga? | Alt1 | Alt2
    if (normalized.includes("|")) {
        const parts = normalized.split("|").map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 3) {
            return {
                question: parts[0],
                options: parts.slice(1),
            };
        }
    }
    
    // Metod 3: Komma-separator efter frågetecken: Vad tycker du? Ja, Nej
    const qMatch = normalized.match(/^(.+\?)\s*(.+)$/);
    if (qMatch) {
        const question = qMatch[1].trim();
        const rest = qMatch[2].trim();
        // Dela på komma eller " eller "
        const opts = rest.split(/,|\s+eller\s+/i).map(o => o.trim()).filter(o => o.length > 0);
        if (opts.length >= 2) {
            return { question, options: opts };
        }
    }
    
    return null;
}

export class OmrostningCommand implements ISlashCommand {
    public command: string = "omrostning";
    public i18nParamsExample: string = "Fråga? | Alt1 | Alt2";
    public i18nDescription: string = "Skapa en omröstning";
    public providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const triggerId = context.getTriggerId();
        const user = context.getSender();
        const room = context.getRoom();
        const argsArray = context.getArguments();

        // Debug: visa vad vi får
        if (argsArray.length > 0) {
            const parsed = parseArguments(argsArray);
            
            if (parsed) {
                const pollData: IPollCreateData = {
                    question: parsed.question,
                    options: parsed.options,
                    singleChoice: true,
                    confidential: false,
                    showResults: true,
                    timeLimit: undefined,
                };

                await createPollMessage(modify, persis, room, user, pollData);
                return;
            } else {
                // Visa hjälp om parsing misslyckades
                const msg = modify.getCreator().startMessage();
                msg.setRoom(room);
                msg.setSender(user);
                msg.setText(
                    "Kunde inte tolka argumenten.\n\n" +
                    "**Användning:**\n" +
                    "/omrostning Fråga? | Alt1 | Alt2 | Alt3\n" +
                    "/omrostning Katt eller hund? Katt, Hund\n" +
                    "\nEller skriv bara /omrostning för formulär"
                );
                await modify.getNotifier().notifyUser(user, msg.getMessage());
                return;
            }
        }

        // Inga argument - öppna modal
        if (triggerId) {
            await createPollModal(modify, user, room, triggerId);
        }
    }
}

export class RostCommand implements ISlashCommand {
    public command: string = "rost";
    public i18nParamsExample: string = "Fråga? | Alt1 | Alt2";
    public i18nDescription: string = "Skapa en omröstning";
    public providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const triggerId = context.getTriggerId();
        const user = context.getSender();
        const room = context.getRoom();
        const argsArray = context.getArguments();

        if (argsArray.length > 0) {
            const parsed = parseArguments(argsArray);
            
            if (parsed) {
                const pollData: IPollCreateData = {
                    question: parsed.question,
                    options: parsed.options,
                    singleChoice: true,
                    confidential: false,
                    showResults: true,
                    timeLimit: undefined,
                };

                await createPollMessage(modify, persis, room, user, pollData);
                return;
            }
        }

        if (triggerId) {
            await createPollModal(modify, user, room, triggerId);
        }
    }
}
