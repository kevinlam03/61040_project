import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FeedDoc extends BaseDoc {
    user: ObjectId,
    post: ObjectId,
}

export interface StarredDoc extends BaseDoc {
    user: ObjectId,
    target: ObjectId,
}


export default class FeedConcept {
    public readonly feeds = new DocCollection<FeedDoc>("feeds");
    public readonly starred = new DocCollection<StarredDoc>("starred");

    async getStarred(user: ObjectId) {
        return await this.starred.readMany({user});
    }

    async addStar(user: ObjectId, target: ObjectId) {
        await this.canAddStar(user, target);
        await this.starred.createOne({user, target})
        return { msg: "Added star!"}
    }

    async removeStar(user: ObjectId, target: ObjectId) {
        await this.canRemoveStar(user, target);
        await this.starred.deleteOne({user, target})
        return { msg: "Removed star!"}
    }


    async addToFeed(user: ObjectId, post: ObjectId) {
        await this.canAddToFeed(user, post);
        await this.feeds.createOne({user, post});
        return { msg: "Added to feed!" };
    }

    async removeFromFeed(user: ObjectId, post: ObjectId) {
        await this.canRemoveFromFeed(user, post);
        await this.feeds.deleteOne({user, post});
        return { msg: "Removed from feed!" };
    }

    async getFeed(user: ObjectId, /*count: number*/) {
        const res = await this.feeds.readMany({user});
        return res
    }

    async starredStatus(user: ObjectId, target: ObjectId) {
        try {
            this.canRemoveStar(user, target);
            return true
        } catch (e) {
            return false
        }
    }

    async canAddToFeed(user: ObjectId, post: ObjectId) {
        const res = await this.feeds.readOne({user, post});
        if (res !== null) {
            throw new PostInFeedAlreadyExistsError(user, post);
        }
    }

    async canRemoveFromFeed(user: ObjectId, post: ObjectId) {
        const res = await this.feeds.readOne({user, post});
        if (res === null) {
            throw new PostNotFoundInFeedError(user, post);
        }
    }

    async canAddStar(user: ObjectId, target: ObjectId) {
        const res = await this.starred.readOne({user, target});
        if (res !== null) {
            throw new AlreadyStarredUserError(user, target);
        }
    }

    async canRemoveStar(user: ObjectId, target: ObjectId) {
        const res = await this.starred.readOne({user, target});
        if (res === null) {
            throw new StarredUserNotFoundError(user, target);
        }
    }
}

export class StarredUserNotFoundError extends NotFoundError {
    constructor(
        public readonly user: ObjectId,
        public readonly target: ObjectId,
    ) {
        super("{0} hasn't starred {1} yet!", user, target)
    }
}

export class AlreadyStarredUserError extends NotAllowedError {
    constructor(
        public readonly user: ObjectId,
        public readonly target: ObjectId,
    ) {
        super("{0} has already starred {1}!", user, target)
    }
}

export class PostInFeedAlreadyExistsError extends NotAllowedError {
    constructor(
        public readonly user: ObjectId,
        public readonly post: ObjectId,
    ) {
        super("Post {1} is already in {0}'s feed!", user, post)
    }
}

export class PostNotFoundInFeedError extends NotFoundError {
    constructor(
        public readonly user: ObjectId,
        public readonly post: ObjectId,
    ) {
        super("Post {1} is not in {0}'s feed!", user, post)
    }
}
