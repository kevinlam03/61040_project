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

// Check features to make sure they're correct 
export default class ScreenTimeConcept {
    public readonly screenTime = new DocCollection<ScreenTimeDoc>("screenTime");


    static getDayMonthYear(date: Date) {
        return {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear() 
        }
    }

    async setTimeUsed(user: ObjectId, feature: Feature, date: {day: number, month: number, year: number}, time: number) {
        // Create document if it doesn't already exist 
        try {
            await this.dataExists(user, feature, date);
        } catch( ScreenTimeDataNotFoundError ) {
            await this.screenTime.createOne({
                user, feature, 
                day: date.day,
                month: date.month,
                year: date.year,
                timeUsed: 0,
            });
        }

        const prevTimeUsed = (await this.screenTime.readOne({
            user, feature, 
            day: date.day,
            month: date.month,
            year: date.year,
        }))?.timeUsed;

        if (prevTimeUsed === undefined) {
            return Error("This shouldn't happen.")
        }

        await this.screenTime.updateOne(
            { 
                user, feature,
                day: date.day,
                month: date.month,
                year: date.year,
            }, 
            {
                timeUsed: prevTimeUsed + time
            }
        );

    }
    
    async getTimeUsed(user: ObjectId, feature: Feature, date: {day: number, month: number, year: number}) {
        await this.dataExists(user, feature, date);

        const res = await this.screenTime.readOne({
            user, feature,
            day: date.day,
            month: date.month,
            year: date.year,
        });

        if (res === null) {
            throw new Error("This shouldn't happen.");
        }

        return res.timeUsed
    }

    async dataExists(user: ObjectId, feature: Feature, date: {day: number, month: number, year: number}) {
        const res = await this.screenTime.readOne({
            user, feature,
            day: date.day,
            month: date.month,
            year: date.year,
        });

        if (res === null) {
            throw new ScreenTimeDataNotFoundError(user, date);
        }
    }
}

export class ScreenTimeDataNotFoundError extends NotAllowedError {
    constructor(
        user: ObjectId,
        date: {day: number, month: number, year: number},
    ) {
        super("ScreenTime data wasn't found for {0} for {date.month}/{date.day}/{date.year}.", user, date)
    }
}