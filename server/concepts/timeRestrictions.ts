import DocCollection, { BaseDoc } from "../framework/doc";
import { ObjectId } from "mongodb";
import { BadValuesError, NotFoundError } from "./errors";

export interface Feature {
    name: string
}

export interface TimeRestrictionDoc extends BaseDoc {
    user: ObjectId;
    feature: Feature;
    limit: number;
}

export default class TimeRestrictionConcept {
    public readonly restrictions = new DocCollection<TimeRestrictionDoc>("timeRestrictions");

    async addRestriction(user: ObjectId, feature: Feature, limit: number) {
        // error check for restriction already exists
        await this.restrictions.createOne({user, feature, limit})
        return { msg: "Added restriction!"}
    }

    async setRestriction(user: ObjectId, feature: Feature, limit: number) {
        // error check for restriction not existing
        // error check for appropriate limit
        await this.restrictions.updateOne({user, feature}, {limit});
        return { msg: "Updated restriction!"}
    }

    async removeRestriction(user: ObjectId, feature: Feature) {
        // error check for restriction not existing
        await this.restrictions.deleteOne({user, feature})
        return { msg: "Removed restriction!"}
    }

    async restrictionExists(user: ObjectId, feature: Feature) {
        const res = await this.restrictions.readOne({user, feature});
        if (res === null) {
            throw new TimeRestrictionNotFoundError(user, feature);
        }
    }

    async restrictionExceeded(user: ObjectId, feature: Feature, time: number) {
        await this.restrictionExists(user, feature);

        const res = await this.restrictions.readOne({user, feature});

        if (res === null) {
            throw Error("This shouldn't happen!")
        }

        return time >= res.limit;
    }
}

export class TimeRestrictionNotFoundError extends NotFoundError {
    constructor(
        public readonly user: ObjectId,
        public readonly feature: Feature,
      ) {
        super("Time Restriction on {1} not found for {0}!", user, feature.name);
      }
}

export class RestrictionLimitBadValuesError extends BadValuesError {
    constructor(
        public readonly limit: number,
    ) {
        super("The restriction limit cannot be {0}!", limit)
    }
}