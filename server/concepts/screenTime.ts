import DocCollection, { BaseDoc } from "../framework/doc";
import { ObjectId } from "mongodb";
import { Feature } from "./timeRestrictions";
import { NotAllowedError } from "./errors";

export interface ScreenTimeDoc extends BaseDoc {
    user: ObjectId;
    feature: Feature;
    timeUsed: number;
    // day is mm, dd, yyyy
    month: number;
    day: number;
    year: number;
    // add information on whether restriction was followed today?
}

export default class ScreenTimeConcept {
    public readonly screenTime = new DocCollection<ScreenTimeDoc>("screenTime");


    static getDayMonthYear(date: Date) {
        return {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear() 
        }
    }

    async setTimeUsed(user: ObjectId, feature: Feature, date: Date, time: number) {
        // Create document if it doesn't already exist 
        const cleanedDate = ScreenTimeConcept.getDayMonthYear(date);

        try {
            await this.dataExists(user, feature, date);
        } catch( ScreenTimeDataNotFoundError ) {
            await this.screenTime.createOne({
                user, feature, 
                day: cleanedDate.day,
                month: cleanedDate.month,
                year: cleanedDate.year,
                timeUsed: 0,
            });
        }

        const prevTimeUsed = (await this.screenTime.readOne({
            user, feature, 
            day: cleanedDate.day,
            month: cleanedDate.month,
            year: cleanedDate.year,
        }))?.timeUsed;

        if (prevTimeUsed === undefined) {
            return Error("This shouldn't happen.")
        }

        await this.screenTime.updateOne(
            { 
                user, feature,
                day: cleanedDate.day,
                month: cleanedDate.month,
                year: cleanedDate.year,
            }, 
            {
                timeUsed: prevTimeUsed + time
            }
        );

    }
    
    async getTimeUsed(user: ObjectId, feature: Feature, date: Date) {
        await this.dataExists(user, feature, date);

        const cleanedDate = ScreenTimeConcept.getDayMonthYear(date);
        const res = await this.screenTime.readOne({
            user, feature, 
            day: cleanedDate.day,
            month: cleanedDate.month,
            year: cleanedDate.year,
        });

        if (res === null) {
            throw new Error("This shouldn't happen.");
        }

        return res.timeUsed
    }

    async dataExists(user: ObjectId, feature: Feature, date: Date) {
        const cleanedDate = ScreenTimeConcept.getDayMonthYear(date);
        const res = await this.screenTime.readOne({
            user, feature, 
            day: cleanedDate.day,
            month: cleanedDate.month,
            year: cleanedDate.year,
        });

        if (res === null) {
            throw new ScreenTimeDataNotFoundError(user);
        }
    }
}

export class ScreenTimeDataNotFoundError extends NotAllowedError {
    constructor(
        user: ObjectId
    ) {
        super("ScreenTime data wasn't found for {0}.", user)
    }
}