import DocCollection, { BaseDoc } from "../framework/doc";
import { ObjectId } from "mongodb";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

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
        await this.canAddRestriction(user, feature);
        await this.restrictions.createOne({user, feature, limit})
        return { msg: "Added restriction!"}
    }

    async setRestriction(user: ObjectId, feature: Feature, limit: number) {
        // error check for restriction not existing
        await this.restrictionExists(user, feature);
        // error check for appropriate limit
        await this.isValidLimit(limit);
        await this.restrictions.updateOne({user, feature}, {limit});
        return { msg: "Updated restriction!"}
    }

    async removeRestriction(user: ObjectId, feature: Feature) {
        // error check for restriction not existing
        await this.restrictionExists(user, feature);
        await this.restrictions.deleteOne({user, feature})
        return { msg: "Removed restriction!"}
    }

    async restrictionExists(user: ObjectId, feature: Feature) {
        const res = await this.restrictions.readOne({user, feature});
        if (res === null) {
            throw new TimeRestrictionNotFoundError(user, feature);
        }
    }

    async canAddRestriction(user: ObjectId, feature: Feature) {
        // If restriction already exists for this user, throw error
        const res = await this.restrictions.readOne({user, feature});
        if (res !== null) {
            throw new TimeRestrictionAlreadyExistsError(user, feature);
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

    async isValidLimit(limit: number) {
        // limit will be in minutes
        if (limit < 0 || limit > 1440) {
            throw new RestrictionLimitBadValuesError();
        }
    }
}

export class TimeRestrictionNotFoundError extends NotFoundError {
    constructor(
        public readonly user: ObjectId,
        public readonly feature: Feature,
    ) {
        super("Time Restriction on {1} not found for {0}!", user, feature);
    }
}

export class TimeRestrictionAlreadyExistsError extends NotAllowedError {
    constructor(
        public readonly user: ObjectId,
        public readonly feature: Feature,
    ) {
        super("Time restriction on {1} already exists for {0}!", user, feature)
    }
}

export class RestrictionLimitBadValuesError extends BadValuesError {
    constructor(
    ) {
        super("The restriction limit must be between 0 and 1440 minutes!");
    }
}